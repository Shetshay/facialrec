package server

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"goDatabase/internal/auth"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
	"github.com/minio/minio-go/v7"
)

func (s *Server) RegisterRoutes() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:8000", "http://localhost:4269"}, // Add both domains
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
	r.POST("/api/getFacialData", s.uploadFacialData)

	r.POST("/api/uploadFile", s.uploadFileHandler)
	r.GET("/api/check-image", s.checkImageHandler)
	r.POST("/api/encrypt", s.encryptHandler)
	r.POST("/api/decrypt", s.decryptHandler)
	r.GET("/api/downloadFile/*path", s.downloadFileHandler)

	r.GET("/api/listBucket", s.listBucket)

	r.POST("/api/deleteFile", s.deleteFileHandler)

	r.POST("/api/createFolder", s.createFolderHandler)

	r.GET("/api/downloadFolderAsZip/:path", s.downloadFolderAsZip)

	// **Add the new endpoint for moving files/folders**
	r.POST("/api/moveFile", s.moveFileHandler)

	r.GET("/api/bucket-stats", s.getBucketStats)


	r.POST("/api/updateProfilePicture", s.updateProfilePictureHandler)

	return r
}

const (
	STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 // 100MB in bytes
)

func (s *Server) getBucketNameByEmail(userEmail string) (string, error) {
	// Retrieve internal user ID from the database
	internalUserID, err := s.db.GetUserIDByEmail(userEmail)
	if err != nil {
		return "", fmt.Errorf("Error retrieving user ID: %v", err)
	}
	// Generate bucket name
	bucketName := fmt.Sprintf("user-%d", internalUserID)
	return bucketName, nil
}

func (s *Server) HelloWorldHandler(c *gin.Context) {
	resp := make(map[string]string)
	resp["message"] = "Hello World"

	c.JSON(http.StatusOK, resp)
}

func (s *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, s.db.Health())
}

func (s *Server) uploadFacialData(c *gin.Context) {
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
	cmd := exec.Command("python3", "./pythonFacialRec/face_scan.py")
	err = cmd.Run()
	if err != nil {
		log.Printf("Error running face_scan.py: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing face scan"})
		return
	}

	detectedFileName := "detected_" + targetFileName
	outputTxtFile := targetFileName[:len(targetFileName)-len(".jpg")] + ".txt"
	fmt.Println(outputTxtFile)

	if targetFileName == "logout.jpg" || !updateOriginTxt {
		log.Println("Running face_data.py script")
		cmd = exec.Command("python3", "./pythonFacialRec/face_data.py", targetFileName, outputTxtFile)
		cmdOutput, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("Error running face_data.py: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing face data"})
			return
		}

		log.Println("Output of face_data.py:")
		log.Printf("%s", cmdOutput)
	}

	if _, err := os.Stat(detectedFileName); err == nil {
		log.Printf("File %s found, upload successful", detectedFileName)
		c.JSON(http.StatusOK, gin.H{"message": "File uploaded and processed successfully"})
	} else {
		log.Printf("Detected file %s not found", detectedFileName)
		c.JSON(http.StatusInternalServerError, gin.H{"error": detectedFileName + " not found"})
	}
}

func (s *Server) logoutHandler(c *gin.Context) {
	provider := c.Param("provider")

	ctx := context.WithValue(c.Request.Context(), "provider", provider)

	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session"})
		return
	}

	userID, ok := session.Values["user_database_id"].(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is missing from session"})
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

	updateErr := s.db.UpdateFaceScannedBool(userID, false)
	if updateErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update faceScannedStatus to false"})
		return
	}

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
		c.String(http.StatusInternalServerError, fmt.Sprintf("Error during user authentication: %v", err))
		return
	}

	userEmail := user.Email

	// Check if user exists in the database
	exists, err := s.db.IsUserInDatabase(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking user in database", "details": err.Error()})
		return
	}

	var internalUserID int
	if exists {
		// Update last login time
		err = s.db.UpdateLastLogin(userEmail)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating last login", "details": err.Error()})
			return
		}
		fmt.Println("User already exists. Last login time updated.")
		profilePicture, err := s.db.GetProfilePictureByEmail(userEmail)
		session.Values["user_profile_picture"] = profilePicture
		// Get internal user ID
		internalUserID, err = s.db.GetUserIDByEmail(userEmail)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving user ID", "details": err.Error()})
			return
		}

	} else {
		// Add user to the database
		internalUserID, err = s.db.AddUser(user.FirstName, user.LastName, userEmail, user.AccessToken, user.UserID, user.AvatarURL)
		session.Values["user_profile_picture"] = user.AvatarURL
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error adding user to database", "details": err.Error()})
			return
		}
		fmt.Println("User added to the database.")
	}

	// Save user info in session
	session.Values["user_email"] = user.Email
	session.Values["user_accesstoken"] = user.AccessToken
	session.Values["user_idtoken"] = user.IDToken
	session.Values["user_id"] = user.UserID
	session.Values["user_fName"] = user.FirstName
	session.Values["user_lName"] = user.LastName
	session.Values["user_database_id"] = internalUserID

    log.Println(user.UserID)

//	fmt.Println(internalUserID)

	// Generate bucket name
	bucketName := fmt.Sprintf("user-%d", internalUserID)

	if err := session.Save(c.Request, c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session", "details": err.Error()})
		return
	}

	// Check if the bucket exists
	minioCtx := context.Background()
	exists, err = s.minioClient.BucketExists(minioCtx, bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking bucket existence", "details": err.Error()})
		return
	}

	if !exists {
		// Create the bucket
		err = s.minioClient.MakeBucket(minioCtx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating bucket", "details": err.Error()})
			return
		}
		fmt.Printf("Bucket %s created successfully\n", bucketName)
	} else {
		fmt.Printf("Bucket %s already exists\n", bucketName)
	}

	// Update user's bucket name in the database
	err = s.db.UpdateUserBucketName(userEmail, bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating user bucket name", "details": err.Error()})
		return
	}

	// Redirect to homepage or desired page
	homepageURL := os.Getenv("HOMEPAGE_REDIRECT")
	if homepageURL == "" {
		homepageURL = "http://localhost:8000/FaceScreenshot"
	}

	c.Redirect(http.StatusFound, homepageURL)
}

func (s *Server) getBucketStats(c *gin.Context) {
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	userEmail, ok := session.Values["user_email"].(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
		return
	}

	bucketName, err := s.getBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name"})
		return
	}

	ctx := context.Background()
	var totalSize int64 = 0

	// List all objects in the bucket
	objectCh := s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Recursive: true,
	})

	for object := range objectCh {
		if object.Err != nil {
			continue
		}
		totalSize += object.Size
	}

	// Convert to MB for frontend display
	usedStorageMB := float64(totalSize) / 1024 / 1024
	totalStorageMB := float64(STORAGE_LIMIT_BYTES) / 1024 / 1024
	percentageUsed := (usedStorageMB / totalStorageMB) * 100

	c.JSON(http.StatusOK, gin.H{
		"usedStorage":    usedStorageMB,
		"totalStorage":   totalStorageMB,
		"percentageUsed": percentageUsed,
	})
}

func (s *Server) uploadFileHandler(c *gin.Context) {
	// Get the session
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session", "details": err.Error()})
		return
	}

	// Get userEmail from session
	userEmail, ok := session.Values["user_email"].(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
		return
	}

	// Get bucket name
	bucketName, err := s.getBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name", "details": err.Error()})
		return
	}

	// Parse multipart form with a larger memory limit (32MB)
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form", "details": err.Error()})
		return
	}

	// Assign the parsed form to `form`
	form := c.Request.MultipartForm

	// Get the current path from form
	currentPath := c.Request.FormValue("path")
	currentPath = strings.Trim(currentPath, "/")
	if currentPath != "" {
		currentPath += "/"
	}

	files := form.File["files"]

	// Get current bucket size
	ctx := context.Background()
	var currentSize int64 = 0
	objectCh := s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Recursive: true,
	})

	for object := range objectCh {
		if object.Err != nil {
			continue
		}
		currentSize += object.Size
	}

	// Calculate total upload size
	var totalUploadSize int64 = 0
	for _, fileHeader := range files {
		totalUploadSize += fileHeader.Size
	}

	// Check if upload would exceed limit
	if currentSize+totalUploadSize > STORAGE_LIMIT_BYTES {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Upload would exceed storage limit of 100MB",
		})
		return
	}

	uploadedFiles := make([]string, 0)
	failedFiles := make([]string, 0)

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			failedFiles = append(failedFiles, fileHeader.Filename)
			continue
		}
		defer file.Close()

		fileBytes, err := io.ReadAll(file)
		if err != nil {
			failedFiles = append(failedFiles, fileHeader.Filename)
			continue
		}

		// Construct the object name with the current path
		objectName := filepath.Join(currentPath, fileHeader.Filename)
		// Convert to forward slashes for MinIO
		objectName = filepath.ToSlash(objectName)

		// Upload the file to MinIO
		reader := bytes.NewReader(fileBytes)
		objectSize := int64(len(fileBytes))
		contentType := fileHeader.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		_, err = s.minioClient.PutObject(
			context.Background(),
			bucketName,
			objectName,
			reader,
			objectSize,
			minio.PutObjectOptions{ContentType: contentType},
		)

		if err != nil {
			log.Printf("Failed to upload file %s: %v", objectName, err)
			failedFiles = append(failedFiles, fileHeader.Filename)
		} else {
			log.Printf("Successfully uploaded file: %s", objectName)
			uploadedFiles = append(uploadedFiles, objectName)
		}
	}

	response := gin.H{
		"uploaded_files": uploadedFiles,
		"total_uploaded": len(uploadedFiles),
	}

	if len(failedFiles) > 0 {
		response["failed_files"] = failedFiles
		response["total_failed"] = len(failedFiles)
	}

	c.JSON(http.StatusOK, response)
}

func (s *Server) authHandler(c *gin.Context) {
	provider := c.Param("provider")

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

func (s *Server) downloadFolderAsZip(c *gin.Context) {
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	userEmail, ok := session.Values["user_email"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	bucketName, err := s.db.GetBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name", "details": err.Error()})
		return
	}

	folderPath := c.Param("path")
	folderPath, err = url.PathUnescape(folderPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid folder path"})
		return
	}
	folderPath = filepath.Clean(folderPath)

	zipFile, err := ioutil.TempFile("", "*.zip")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temporary file"})
		return
	}
	defer zipFile.Close()
	defer os.Remove(zipFile.Name())

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// List all objects in the folder
	ctx := context.Background()
	objectsCh := s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Prefix:    folderPath + "/",
		Recursive: true,
	})

	for object := range objectsCh {
		if object.Err != nil {
			log.Printf("Error listing objects: %v", object.Err)
			continue
		}

		objectReader, err := s.minioClient.GetObject(ctx, bucketName, object.Key, minio.GetObjectOptions{})
		if err != nil {
			log.Printf("Error getting object: %v", err)
			continue
		}
		defer objectReader.Close()

		zipEntry, err := zipWriter.Create(object.Key)
		if err != nil {
			log.Printf("Error creating zip entry: %v", err)
			continue
		}

		_, err = io.Copy(zipEntry, objectReader)
		if err != nil {
			log.Printf("Error copying object to zip: %v", err)
		}
	}

	zipWriter.Close()

	c.Header("Content-Disposition", "attachment; filename=\"folder.zip\"")
	c.Header("Content-Type", "application/zip")
	zipFile.Seek(0, 0)
	io.Copy(c.Writer, zipFile)
}

func (s *Server) userCookieInfo(c *gin.Context) {
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session"})
		return
	}

	userEmail, ok := session.Values["user_email"].(string)

	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	userfName := session.Values["user_fName"].(string)
	userlName := session.Values["user_lName"].(string)
	userID := session.Values["user_database_id"].(int)
    userProfilePicture := session.Values["user_profile_picture"]
	faceScannedStatus, err := s.db.CheckIfFaceisScanned(userID)
    userOAuthID := session.Values["user_id"].(string)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get faceScannedStatus"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"email":             userEmail,
		"firstName":         userfName,
		"lastName":          userlName,
		"userID":            userID,
		"faceScannedStatus": faceScannedStatus,
        "profilePicture": userProfilePicture,
        "userOAuthID": userOAuthID,
	})
}

func (s *Server) uploadHandler(c *gin.Context) {
	log.Println("Received upload request")

	file, header, err := c.Request.FormFile("file")
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

	// Get the user's bucket name from the database
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session"})
		return
	}

	userEmail, ok := session.Values["user_email"].(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
		return
	}

	bucketName, err := s.db.GetBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving bucket name", "details": err.Error()})
		return
	}

	// Upload the file to MinIO
	fileName := header.Filename
	reader := bytes.NewReader(fileBytes)
	objectSize := int64(len(fileBytes))
	contentType := header.Header.Get("Content-Type")

	_, err = s.minioClient.PutObject(context.Background(), bucketName, fileName, reader, objectSize, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		log.Printf("Error uploading file to MinIO: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error uploading file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully"})
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

	cmd := exec.Command("python3", "./pythonFacialRec/encrypt.py")
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

	cmd := exec.Command("python3", "./pythonFacialRec/decrypt.py")
	err := cmd.Run()
	if err != nil {
		log.Printf("Error running decrypt.py: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Decryption failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Decryption process completed successfully"})
}

func (s *Server) downloadFileHandler(c *gin.Context) {
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	userEmail, ok := session.Values["user_email"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Get bucket name
	bucketName, err := s.db.GetBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name", "details": err.Error()})
		return
	}

	// Get file path from URL parameter
	filePath := c.Param("path")

	// Decode URL-encoded file path
	objectName, err := url.PathUnescape(filePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
		return
	}

	// Clean the object name to prevent path traversal
	objectName = filepath.Clean(objectName)

	// Get object from MinIO
	object, err := s.minioClient.GetObject(context.Background(), bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file", "details": err.Error()})
		return
	}
	defer object.Close()

	// Get object info to set headers
	objectInfo, err := object.Stat()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Set the headers for streaming the file
	contentType := "application/octet-stream"
	if filepath.Ext(objectName) == ".pdf" {
		contentType = "application/pdf"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Length", fmt.Sprintf("%d", objectInfo.Size))

	// Stream the file to response
	if _, err := io.Copy(c.Writer, object); err != nil {
		log.Printf("Error streaming file: %v", err)
	}
}

func (s *Server) listBucket(c *gin.Context) {
	// Get the session
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get userEmail from session
	userEmail, ok := session.Values["user_email"].(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
		return
	}

	// Get and clean the path
	currentPath := strings.TrimSpace(c.Query("path"))
	currentPath = strings.Trim(currentPath, "/")
	if currentPath != "" {
		currentPath += "/"
	}

	// Get bucket name
	bucketName, err := s.getBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name"})
		return
	}

	ctx := context.Background()

	// Check if bucket exists
	exists, err := s.minioClient.BucketExists(ctx, bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bucket does not exist"})
		return
	}

	// List all objects with the prefix
	objectCh := s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Prefix:    currentPath,
		Recursive: false,
	})

	var objects []map[string]interface{}
	seenFolders := make(map[string]bool)

	for object := range objectCh {
		if object.Err != nil {
			log.Printf("Error listing object: %v", object.Err)
			continue
		}

		name := strings.TrimPrefix(object.Key, currentPath)
		if name == "" || object.Key == currentPath {
			continue
		}

		// Handle folders
		if strings.Contains(name, "/") {
			folderName := strings.Split(name, "/")[0]
			if !seenFolders[folderName] {
				seenFolders[folderName] = true
				objects = append(objects, map[string]interface{}{
					"name":         folderName,
					"lastModified": object.LastModified,
					"size":         0,
					"type":         "folder",
					"contentType":  "folder",
					"path":         filepath.Join(currentPath, folderName),
				})
			}
			continue
		}

		// Improved content type detection for files
		var contentType string
		ext := strings.ToLower(filepath.Ext(name))

		// Map common extensions to MIME types
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".pdf":
			contentType = "application/pdf"
		case ".doc", ".docx":
			contentType = "application/msword"
		case ".xls", ".xlsx":
			contentType = "application/vnd.ms-excel"
		case ".txt":
			contentType = "text/plain"
		case ".mp3":
			contentType = "audio/mpeg"
		case ".mp4":
			contentType = "video/mp4"
		case ".zip":
			contentType = "application/zip"
		default:
			// Try to detect content type, fallback to octet-stream
			if mimeType := mime.TypeByExtension(ext); mimeType != "" {
				contentType = mimeType
			} else {
				contentType = "application/octet-stream"
			}
		}

		// Get object info to ensure we have content type
		objInfo, err := s.minioClient.StatObject(ctx, bucketName, object.Key, minio.StatObjectOptions{})
		if err == nil && objInfo.ContentType != "" {
			contentType = objInfo.ContentType
		}

		// Create presigned URL for direct access
		url, err := s.minioClient.PresignedGetObject(ctx, bucketName, object.Key, time.Hour, nil)
		var urlString string
		if err == nil {
			urlString = url.String()
		}

		objects = append(objects, map[string]interface{}{
			"name":         name,
			"lastModified": object.LastModified,
			"size":         object.Size,
			"type":         "file",
			"contentType":  contentType,
			"url":          urlString,
			"path":         object.Key,
		})

		log.Printf("Added file: %s with content type: %s", name, contentType)
	}

	c.JSON(http.StatusOK, gin.H{
		"files":       objects,
		"currentPath": currentPath,
	})
}

func (s *Server) deleteFileHandler(c *gin.Context) {
	// Get session
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	userEmail, ok := session.Values["user_email"].(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
		return
	}

	// Get request body
	var req struct {
		Path string `json:"path"` // Full path including filename or folder name
		Type string `json:"type"` // "file" or "folder"
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Get bucket name
	bucketName, err := s.getBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name"})
		return
	}

	ctx := context.Background()

	if req.Type == "folder" {
		// List all objects in the folder to count them
		objectsCh := s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
			Prefix:    req.Path + "/",
			Recursive: true,
		})

		var objects []string
		for object := range objectsCh {
			if object.Err != nil {
				log.Printf("Error listing objects: %v", object.Err)
				continue
			}
			objects = append(objects, object.Key)
		}

		// If not already confirmed and folder has contents, return count
		if c.Query("confirmed") != "true" && len(objects) > 0 {
			c.JSON(http.StatusOK, gin.H{
				"hasContents":       true,
				"count":             len(objects),
				"needsConfirmation": true,
			})
			return
		}

		// Delete all objects
		for _, objectKey := range objects {
			err := s.minioClient.RemoveObject(ctx, bucketName, objectKey, minio.RemoveObjectOptions{})
			if err != nil {
				log.Printf("Error deleting object %s: %v", objectKey, err)
			}
		}

		// Also delete the folder marker if it exists
		folderMarker := strings.TrimSuffix(req.Path, "/") + "/"
		err = s.minioClient.RemoveObject(ctx, bucketName, folderMarker, minio.RemoveObjectOptions{})
		if err != nil {
			log.Printf("Error deleting folder marker: %v", err)
		}

	} else {
		// Single file deletion
		err = s.minioClient.RemoveObject(ctx, bucketName, req.Path, minio.RemoveObjectOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Failed to delete file: %v", err),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func (s *Server) createFolderHandler(c *gin.Context) {
	// Get the session
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get userEmail from session
	userEmail, ok := session.Values["user_email"].(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
		return
	}

	// Parse request body
	var req struct {
		FolderName string `json:"folderName"`
		Path       string `json:"path"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Get bucket name
	bucketName, err := s.getBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name"})
		return
	}

	// Construct the folder path
	folderPath := req.FolderName
	if req.Path != "" {
		folderPath = filepath.Join(req.Path, req.FolderName)
	}
	// Ensure the path ends with a forward slash to indicate it's a folder
	if !strings.HasSuffix(folderPath, "/") {
		folderPath += "/"
	}

	// Convert Windows-style paths to forward slashes
	folderPath = filepath.ToSlash(folderPath)

	// Create an empty object with the folder name (this is how MinIO handles folders)
	_, err = s.minioClient.PutObject(
		context.Background(),
		bucketName,
		folderPath,
		bytes.NewReader([]byte{}),
		0,
		minio.PutObjectOptions{ContentType: "application/x-directory"},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create folder"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Folder created successfully",
		"folderPath": folderPath,
	})
}

// **Add the moveFileHandler function**
func (s *Server) moveFileHandler(c *gin.Context) {
	// Get the session
	session, err := auth.Store.Get(c.Request, auth.SessionName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get userEmail from session
	userEmail, ok := session.Values["user_email"].(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
		return
	}

	// Parse request body
	var req struct {
		SourcePath      string `json:"sourcePath"`
		DestinationPath string `json:"destinationPath"`
		Type            string `json:"type"` // "file" or "folder"
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Get bucket name
	bucketName, err := s.getBucketNameByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name"})
		return
	}

	ctx := context.Background()

	// Clean and prepare paths
	sourcePath := strings.Trim(req.SourcePath, "/")
	destinationPath := strings.Trim(req.DestinationPath, "/")

	if sourcePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Source path cannot be empty"})
		return
	}

	// For root destination, destinationPath will be empty
	if destinationPath != "" {
		destinationPath += "/"
	}

	if req.Type == "folder" {
		// Move folder by copying all objects under the source folder to the destination folder
		srcPrefix := sourcePath + "/"
		objectsCh := s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
			Prefix:    srcPrefix,
			Recursive: true,
		})

		for object := range objectsCh {
			if object.Err != nil {
				log.Printf("Error listing objects: %v", object.Err)
				continue
			}

			// Prepare the destination object name
			relativePath := strings.TrimPrefix(object.Key, srcPrefix)
			destObjectName := filepath.Join(destinationPath, sourcePath, relativePath)
			destObjectName = filepath.ToSlash(destObjectName)

			// Copy the object
			src := minio.CopySrcOptions{
				Bucket: bucketName,
				Object: object.Key,
			}
			dst := minio.CopyDestOptions{
				Bucket: bucketName,
				Object: destObjectName,
			}

			_, err := s.minioClient.CopyObject(ctx, dst, src)
			if err != nil {
				log.Printf("Error copying object %s to %s: %v", object.Key, destObjectName, err)
				continue
			}
		}

		// Delete the source folder and its contents
		err = s.deleteObjects(ctx, bucketName, srcPrefix)
		if err != nil {
			log.Printf("Error deleting source folder %s: %v", srcPrefix, err)
		}

	} else if req.Type == "file" {
		// Move a single file
		// Prepare the destination object name
		fileName := filepath.Base(sourcePath)
		destObjectName := filepath.Join(destinationPath, fileName)
		destObjectName = filepath.ToSlash(destObjectName)

		// Copy the object
		src := minio.CopySrcOptions{
			Bucket: bucketName,
			Object: sourcePath,
		}
		dst := minio.CopyDestOptions{
			Bucket: bucketName,
			Object: destObjectName,
		}

		_, err := s.minioClient.CopyObject(ctx, dst, src)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move file"})
			return
		}

		// Delete the source object
		err = s.minioClient.RemoveObject(ctx, bucketName, sourcePath, minio.RemoveObjectOptions{})
		if err != nil {
			log.Printf("Error deleting source file %s: %v", sourcePath, err)
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item moved successfully"})
}

// **Helper function to delete multiple objects**
func (s *Server) deleteObjects(ctx context.Context, bucketName, prefix string) error {
	objectsCh := make(chan minio.ObjectInfo)

	go func() {
		defer close(objectsCh)
		for object := range s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
			Prefix:    prefix,
			Recursive: true,
		}) {
			if object.Err != nil {
				log.Printf("Error listing objects for deletion: %v", object.Err)
				continue
			}
			objectsCh <- object
		}
	}()

	for err := range s.minioClient.RemoveObjects(ctx, bucketName, objectsCh, minio.RemoveObjectsOptions{}) {
		if err.Err != nil {
			log.Printf("Error deleting object %s: %v", err.ObjectName, err.Err)
		}
	}

	return nil
}

func (s *Server) updateProfilePictureHandler(c *gin.Context) {
    log.Println("Received profile picture update request") // Add logging

    // Get session
    session, err := auth.Store.Get(c.Request, auth.SessionName)
    if err != nil {
        log.Printf("Session error: %v", err) // Add logging
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
        return
    }

    // Get user email from session
    userEmail, ok := session.Values["user_email"].(string)
    if !ok || userEmail == "" {
        log.Println("User email not found in session") // Add logging
        c.JSON(http.StatusUnauthorized, gin.H{"error": "User not logged in"})
        return
    }

    // Parse multipart form
    if err := c.Request.ParseMultipartForm(5 * 1024 * 1024); err != nil {
        log.Printf("Error parsing multipart form: %v", err) // Add logging
        c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
        return
    }

    // Get the file from form
    file, fileHeader, err := c.Request.FormFile("profilePicture")
    if err != nil {
        log.Printf("Error getting file from form: %v", err) // Add logging
        c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
        return
    }
    defer file.Close()

    // Validate file size (5MB limit)
    if fileHeader.Size > 5*1024*1024 {
        log.Printf("File too large: %d bytes", fileHeader.Size) // Add logging
        c.JSON(http.StatusBadRequest, gin.H{"error": "File size too large (max 5MB)"})
        return
    }

    // Validate file type
    contentType := fileHeader.Header.Get("Content-Type")
    if !strings.HasPrefix(contentType, "image/") {
        log.Printf("Invalid content type: %s", contentType) // Add logging
        c.JSON(http.StatusBadRequest, gin.H{"error": "File must be an image"})
        return
    }

    // Read file
    buffer, err := io.ReadAll(file)
    if err != nil {
        log.Printf("Error reading file: %v", err) // Add logging
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
        return
    }

    // Upload to MinIO
    bucketName, err := s.getBucketNameByEmail(userEmail)
    if err != nil {
        log.Printf("Error getting bucket name: %v", err) // Add logging
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error getting bucket name"})
        return
    }

    // Generate unique filename for profile picture
    fileName := fmt.Sprintf("profile-picture-%d%s", time.Now().UnixNano(), filepath.Ext(fileHeader.Filename))
    
    // Upload to MinIO
    reader := bytes.NewReader(buffer)
    _, err = s.minioClient.PutObject(
        context.Background(),
        bucketName,
        fileName,
        reader,
        int64(len(buffer)),
        minio.PutObjectOptions{ContentType: contentType},
    )
    if err != nil {
        log.Printf("Error uploading to MinIO: %v", err) // Add logging
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
        return
    }

    // Generate URL for the uploaded file
    profilePictureURL := fmt.Sprintf("api/downloadFile/%s", fileName)

    // Update profile picture URL in database
    err = s.db.UpdateProfilePicture(userEmail, profilePictureURL)
    if err != nil {
        log.Printf("Error updating database: %v", err) // Add logging
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile picture in database"})
        return
    }

    // Update session with new profile picture URL
    session.Values["user_profile_picture"] = profilePictureURL
    if err := session.Save(c.Request, c.Writer); err != nil {
        log.Printf("Error saving session: %v", err) // Add logging
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update session"})
        return
    }

    log.Println("Profile picture updated successfully") // Add logging
    c.JSON(http.StatusOK, gin.H{
        "message": "Profile picture updated successfully",
        "profilePicture": profilePictureURL,
    })
}