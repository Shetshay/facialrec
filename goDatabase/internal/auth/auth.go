package auth

import (
    "log"
    "os"

    "github.com/gorilla/sessions"
    "github.com/joho/godotenv"
    "github.com/markbates/goth/gothic"
    "github.com/markbates/goth"
    "github.com/markbates/goth/providers/google"
)

const (
    MaxAge = 864000 * 30
    IsProd = false
)

var SessionName = "session-name"

var Store *sessions.CookieStore


func NewAuth() {
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    googleClientId := os.Getenv("GOOGLE_CLIENT_ID")
    googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
    sessionSecret := os.Getenv("SESSION_SECRET")
    //error handling
    if googleClientId == "" || googleClientSecret == "" || sessionSecret == "" {
        log.Fatal("Environment variables not set properly")
    }


    Store = sessions.NewCookieStore([]byte(sessionSecret))
    if Store == nil {
        log.Fatalf("failed to create session store")
    }

    Store.Options = &sessions.Options{
        Path:     "/",
        MaxAge:   86400 * 30,
        HttpOnly: true,
        Secure:   os.Getenv("GIN_MODE") == "release", // True if in production
    }

    gothic.Store = Store

    callbackURL := os.Getenv("OAUTH_CALLBACK_URL")


    if callbackURL == "" {
     callbackURL = "http://facialrec.org/api/auth/google/callback"
    }

    goth.UseProviders(
        google.New(googleClientId, googleClientSecret, callbackURL),
    )


}
