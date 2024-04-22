package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

func (s *Server) RegisterRoutes() *gin.Engine {
	r := gin.Default()

    r.GET("/auth/:provider/callback", s.getAuthCallbackFunction)

    r.GET("/auth/:provider", s.authHandler)

	r.GET("/hello", s.HelloWorldHandler)

	r.POST("/health", s.healthHandler)

    r.POST("/userinfo", s.queryDataHandler)

    r.Static("/static", "./client/dist")


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
	// Example: Fetch all entries from a hypothetical "items" table
	query := "SELECT userid, useremail, username, signupdata, lastlogin FROM userinfo"
	data, err := s.db.QueryData(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (s *Server) getAuthCallbackFunction(c *gin.Context) {
    provider := c.Param("provider")

    ctx := context.WithValue(c.Request.Context(), "provider", provider)

    user, err := gothic.CompleteUserAuth(c.Writer, c.Request.WithContext(ctx))
    if err != nil {
        c.String(http.StatusInternalServerError, fmt.Sprintf("Error: %v", err))
        return
    }

    jsonUser, err := json.MarshalIndent(user, "", "   ")
    if err != nil {
        log.Fatalf("Error marshaling JSON: %v", err)
    }

    fmt.Println(string(jsonUser))

    homepageURL := os.Getenv("HOMEPAGE_REDIRECT")

    if homepageURL == "" {
         homepageURL= "http://facialrec.org/api/static"
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

