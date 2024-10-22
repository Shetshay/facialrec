package server

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
	"goDatabase/internal/auth"
)

func (s *Server) RegisterRoutes() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		MaxAge: 12 * time.Hour,
	}))

	r.GET("/api/auth/:provider/callback", s.getAuthCallbackFunction)
	r.GET("/api/auth/:provider", s.authHandler)
	r.GET("/api/hello", s.HelloWorldHandler)
	r.POST("/api/health", s.healthHandler)
	r.GET("/api/userCookieInfo", s.userCookieInfo)
	r.GET("/api/logout/:provider", s.logoutHandler)

	r.POST("/api/upload", s.uploadHandler)
	r.GET("/api/check-image", s.checkImageHandler)
	r.POST("/api/encrypt", s.encryptHandler)
	r.POST("/api/decrypt", s.decryptHandler)

	return r
}

func (s *Server) HelloWorldHandler(c *gin.Context) {
	resp := make(map[string]string)
	resp["message"] = "Hello World"

	c.JSON(http.StatusOK, resp)
}

func (s *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, s.db.Health())
}

func (s *Server) logoutHandler(c *gin.Context) {
	provider := c.Param("provider")

	ctx := context.WithValue(c.Request.Context(), "provider", provider)

	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session"})
		return
	}

	session.Values = make(map[interface{}]interface{})
	session.Options.MaxAge = -1
	session.Options.SameSite = http.SameSiteNoneMode
	session.Options.Secure = true

	if err := session.Save(c.Request, c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session"})
		return
	}

	gothic.Logout(c.Writer, c.Request.WithContext(ctx))
	gothic.Logout(c.Writer, c.Request.WithContext(ctx))

	homepageURL := os.Getenv("HOMEPAGE_REDIRECT")
	if homepageURL == "" {
		homepageURL = "http://localhost:8000"
	}

	c.Redirect(http.StatusFound, homepageURL)
}

func (s *Server) getAuthCallbackFunction(c *gin.Context) {
	provider := c.Param("provider")
	ctx := context.WithValue(c.Request.Context(), "provider", provider)

	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session", "details": err.Error()})
		return
	}

	user, err := gothic.CompleteUserAuth(c.Writer, c.Request.WithContext(ctx))
	if err != nil {
		c.String(http.StatusInternalServerError, fmt.Sprintf("Error: during user authentication %v", err))
		return
	}

	userEmail := user.Email

	session.Values["user_email"] = user.Email
	session.Values["user_accesstoken"] = user.AccessToken
	session.Values["user_idtoken"] = user.IDToken
	session.Values["user_id"] = user.UserID
	session.Values["user_fName"] = user.FirstName
	session.Values["user_lName"] = user.LastName

	if err := session.Save(c.Request, c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session", "details": err.Error()})
		return
	}

	exists, err := s.db.IsUserInDatabase(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking user in database", "details": err.Error()})
		return
	}

	if exists {
		err = s.db.UpdateLastLogin(userEmail)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating last login", "details": err.Error()})
			return
		}
		fmt.Println("User already exists. Last login time updated.")
	} else {
		err = s.db.AddUser(user.FirstName, user.LastName, userEmail, user.AccessToken, user.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error adding user to database", "details": err.Error()})
			return
		}
		fmt.Println("User added to the database.")
	}

	homepageURL := os.Getenv("HOMEPAGE_REDIRECT")
	if homepageURL == "" {
		homepageURL = "http://localhost:8000/FaceScreenshot"
	}

	c.Redirect(http.StatusFound, homepageURL)
	c.Redirect(http.StatusFound, homepageURL)
}

func (s *Server) authHandler(c *gin.Context) {
	provider := c.Param("provider")

	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You must select a provider"})
		return
	}
	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You must select a provider"})
		return
	}

	ctx := context.WithValue(c.Request.Context(), "provider", provider)

	if gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request.WithContext(ctx)); err == nil {
		c.JSON(http.StatusOK, gothUser)
	} else {
		gothic.BeginAuthHandler(c.Writer, c.Request.WithContext(ctx))
	}
}

func (s *Server) userCookieInfo(c *gin.Context) {
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session"})
		return
	}

	userEmail, ok := session.Values["user_email"].(string)
    userfName := session.Values["user_fName"].(string)
    userlName := session.Values["user_lName"].(string)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

    c.JSON(http.StatusOK, gin.H{"email": userEmail, "firstName": userfName, "lastName": userlName})
}

func (s *Server) uploadHandler(c *gin.Context) {
	log.Println("Received upload request")

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		log.Printf("Error getting file from form: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to read file"})
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		log.Printf("Error reading file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading file"})
		return
	}

	targetFileName := "origin.jpg"
	updateOriginTxt := false
	if _, err := os.Stat(targetFileName); err == nil {
		targetFileName = "logout.jpg"
		updateOriginTxt = true
		log.Println("origin.jpg exists, updating target to logout.jpg")
	} else {
		log.Println("No origin.jpg, using origin.jpg as target")
	}

	err = os.WriteFile(targetFileName, fileBytes, 0644)
	if err != nil {
		log.Printf("Error writing file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to write file"})
		return
	}

	log.Println("Running face_scan.py script")
    cmd := exec.Command("python3", "../../../pythonFacialRec/face_scan.py")
	err = cmd.Run()
	if err != nil {
		log.Printf("Error running face_scan.py: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing face scan"})
		return
	}

	detectedFileName := "detected_" + targetFileName
	outputTxtFile := targetFileName[:len(targetFileName)-len(".jpg")] + ".txt"

	if targetFileName == "logout.jpg" || !updateOriginTxt {
		log.Println("Running face_data.py script")
		cmd = exec.Command("python3", "face_data.py", targetFileName, outputTxtFile)
		err = cmd.Run()
		if err != nil {
			log.Printf("Error running face_data.py: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing face data"})
			return
		}
	}

	if _, err := os.Stat(detectedFileName); err == nil {
		log.Printf("File %s found, upload successful", detectedFileName)
		c.JSON(http.StatusOK, gin.H{"message": "File uploaded and processed successfully"})
	} else {
		log.Printf("Detected file %s not found", detectedFileName)
		c.JSON(http.StatusInternalServerError, gin.H{"error": detectedFileName + " not found"})
	}
}

func (s *Server) checkImageHandler(c *gin.Context) {
	log.Println("Received check image request")
	var imageName string

	if _, err := os.Stat("detected_logout.jpg"); err == nil {
		imageName = "detected_logout.jpg"
		log.Println("detected_logout.jpg found")
	} else if _, err := os.Stat("detected_origin.jpg"); err == nil {
		imageName = "detected_origin.jpg"
		log.Println("detected_origin.jpg found")
	}

	if imageName != "" {
		c.String(http.StatusOK, imageName)
	} else {
		log.Println("No processed image found")
		c.JSON(http.StatusNotFound, gin.H{"error": "No processed image available"})
	}
}

func (s *Server) encryptHandler(c *gin.Context) {
	log.Println("Received encrypt request")

	cmd := exec.Command("python3", "../pythonFacialRec/encrypt.py")
	err := cmd.Run()
	if err != nil {
		log.Printf("Error running encrypt.py: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Encryption process completed successfully"})
}

func (s *Server) decryptHandler(c *gin.Context) {
	log.Println("Received decrypt request")

	cmd := exec.Command("python3", "../pythonFacialRec/decrypt.py")
	err := cmd.Run()
	if err != nil {
		log.Printf("Error running decrypt.py: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Decryption failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Decryption process completed successfully"})
}
