package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Received upload request")
    if r.Method != "POST" {
        log.Printf("Invalid method: %s", r.Method)
        http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
        return
    }

    file, _, err := r.FormFile("file")
    if err != nil {
        log.Printf("Error getting file from form: %v", err)
        http.Error(w, "Unable to read file", http.StatusInternalServerError)
        return
    }
    defer file.Close()

    log.Println("Reading file content")
    fileBytes, err := ioutil.ReadAll(file)
    if err != nil {
        log.Printf("Error reading file: %v", err)
        http.Error(w, "Error reading file", http.StatusInternalServerError)
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

    log.Printf("Writing file to %s", targetFileName)
    err = ioutil.WriteFile(targetFileName, fileBytes, 0644)
    if err != nil {
        log.Printf("Error writing file: %v", err)
        http.Error(w, "Unable to write file", http.StatusInternalServerError)
        return
    }

    log.Println("Running face_scan.py script")
    cmd := exec.Command("python3", "face_scan.py")
    err = cmd.Run()
    if err != nil {
        log.Printf("Error running face_scan.py: %v", err)
        http.Error(w, "Error processing face scan", http.StatusInternalServerError)
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
            http.Error(w, "Error processing face data", http.StatusInternalServerError)
            return
        }
    }

    if _, err := os.Stat(detectedFileName); err == nil {
        log.Printf("File %s found, upload successful", detectedFileName)
        w.Write([]byte("File uploaded and processed successfully"))
    } else {
        log.Printf("Detected file %s not found", detectedFileName)
        http.Error(w, detectedFileName+" not found", http.StatusInternalServerError)
    }
}

func checkImageHandler(w http.ResponseWriter, r *http.Request) {
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
		w.Write([]byte(imageName))
	} else {
		log.Println("No processed image found")
		http.Error(w, "No processed image available", http.StatusNotFound)
	}
}

func encryptHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Received encrypt request")
    if r.Method != "POST" {
        log.Printf("Invalid method: %s", r.Method)
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }

    log.Println("Running encrypt.py script")
    cmd := exec.Command("python3", "encrypt.py")
    err := cmd.Run()
    if err != nil {
        log.Printf("Error running encrypt.py: %v", err)
        http.Error(w, "Encryption failed", http.StatusInternalServerError)
        return
    }

    w.Write([]byte("Encryption process completed successfully"))
}

func decryptHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Received decrypt request")
    if r.Method != "POST" {
        log.Printf("Invalid method: %s", r.Method)
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }

    log.Println("Running decrypt.py script")
    cmd := exec.Command("python3", "decrypt.py")
    err := cmd.Run()
    if err != nil {
        log.Printf("Error running decrypt.py: %v", err)
        http.Error(w, "Decryption failed", http.StatusInternalServerError)
        return
    }

    w.Write([]byte("Decryption process completed successfully"))
}

func main() {
	log.Println("Starting server on :8080...")
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)
	http.HandleFunc("/upload", uploadHandler)
	http.HandleFunc("/check-image", checkImageHandler)
	http.HandleFunc("/encrypt", encryptHandler)
	http.HandleFunc("/decrypt", decryptHandler)

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
