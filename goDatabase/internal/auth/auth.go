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

func NewAuth() {
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    googleClientId := os.Getenv("GOOGLE_CLIENT_ID")
    googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
    sessionSecret := os.Getenv("SESSION_SECRET")


    store := sessions.NewCookieStore([]byte(sessionSecret))
    store.MaxAge(MaxAge)

    store.Options.Path = "/"
    store.Options.HttpOnly = true
    store.Options.Secure= IsProd

    gothic.Store = store

    callbackURL := os.Getenv("OAUTH_CALLBACK_URL")

    if callbackURL == "" {
     callbackURL = "http://facialrec.org/api/auth/google/callback"
    }

    goth.UseProviders(
        google.New(googleClientId, googleClientSecret, callbackURL),
    )


}
