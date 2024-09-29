package server

import (
	"context"
//	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
    "time"

//    "github.com/gorilla/sessions"
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
			return true // or include logic to check the origin
		},
		MaxAge: 12 * time.Hour,
	}))


    r.GET("/api/auth/:provider/callback", s.getAuthCallbackFunction)

    r.GET("/api/auth/:provider", s.authHandler)

	r.GET("/api/hello", s.HelloWorldHandler)

	r.POST("/api/health", s.healthHandler)

    r.POST("/api/userinfo", s.queryDataHandler)

    r.GET("/api/userCookieInfo", s.userCookieInfo)

    r.GET("/api/logout/:provider", s.logoutHandler)


//    r.Static("/static", "./client/dist")


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

func (s *Server) queryDataHandler(c *gin.Context) {
	query := "SELECT userid, useremail, username, signupdata, lastlogin FROM userinfo"
	data, err := s.db.QueryData(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (s *Server) logoutHandler(c *gin.Context) {
    provider := c.Param("provider")

    ctx := context.WithValue(c.Request.Context(), "provider", provider)

    session, err := auth.Store.Get(c.Request, auth.SessionName)
    if err != nil {
        // Handle error, perhaps return an HTTP error response
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session"})
        return
    }

    session.Values = make(map[interface{}]interface{})

    // Set the Max-Age of the cookie to -1 to delete it
    session.Options.MaxAge = -1

    // Set SameSite and Secure attributes
    session.Options.SameSite = http.SameSiteNoneMode
    session.Options.Secure = true // Set to true if your site is served over HTTPS

    if err := session.Save(c.Request, c.Writer); err != nil {
        // Handle error, perhaps return an HTTP error response
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session"})
        return
    }


    gothic.Logout(c.Writer, c.Request.WithContext(ctx))

    homepageURL := os.Getenv("HOMEPAGE_REDIRECT")

    if homepageURL == "" {
        homepageURL= "http://localhost:8000"
    }

    c.Redirect(http.StatusFound, homepageURL)

}

func (s *Server) getAuthCallbackFunction(c *gin.Context) {
    provider := c.Param("provider")

    ctx := context.WithValue(c.Request.Context(), "provider", provider)

    if auth.Store == nil {
        log.Println("Session store is not initialized")
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
        return
    }

    session, err := auth.Store.Get(c.Request, auth.SessionName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get session", "details": err.Error()})
        return
    }

    user, err := gothic.CompleteUserAuth(c.Writer, c.Request.WithContext(ctx))
    if err != nil {
        c.String(http.StatusInternalServerError, fmt.Sprintf("Error: during user authentication %v", err));
        return
    }

    session.Values["user_email"] = user.Email
    //checking to see if it is being checked
    userEmail := session.Values["user_email"]
    if userEmail != nil {
//        fmt.Println("user_email is:", userEmail)
    } else {
        fmt.Println("IT NOT WORKED")
    }

    // Set SameSite and Secure attributes
    session.Options.SameSite = http.SameSiteNoneMode
    session.Options.Secure = true // Set to true if your site is served over HTTPS


    if err := session.Save(c.Request, c.Writer); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session", "details": err.Error()})
        return
    }

    homepageURL := os.Getenv("HOMEPAGE_REDIRECT")

    if homepageURL == "" {
        homepageURL= "http://localhost:8000"
    }

    c.Redirect(http.StatusFound, homepageURL)
}


func (s *Server) authHandler(c *gin.Context) {
    provider := c.Param("provider") // This gets the provider from the route parameter

    if provider == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "You must select a provider"})
        return
    }

    ctx := context.WithValue(c.Request.Context(), "provider", provider)

    // try to get the user without re-authenticating
    if gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request.WithContext(ctx)); err == nil {
        // If user is already authenticated, render or return the user information
        // Here, instead of using 'template', we directly return the gothUser as JSON
        c.JSON(http.StatusOK, gothUser)
    } else {
        // If not authenticated, begin the authentication process
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
    if !ok {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }


    c.JSON(http.StatusOK, gin.H{"email": userEmail})
}
