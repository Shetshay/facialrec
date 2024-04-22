package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == "POST" {
        file, _, err := r.FormFile("file")
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        defer file.Close()

        // Read the file into a buffer
        fileBytes, err := ioutil.ReadAll(file)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        // Determine the correct file name based on the existence of origin.jpg and logout.jpg
        targetFileName := "origin.jpg"
        updateOriginTxt := false
        if _, err := os.Stat(targetFileName); err == nil {
            targetFileName = "logout.jpg"
            updateOriginTxt = true // Only update origin.txt if origin.jpg already exists
        }

        // Write the buffer into the determined file
        err = ioutil.WriteFile(targetFileName, fileBytes, 0644)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        // Change permissions of the new file to 777
        err = os.Chmod(targetFileName, 0777)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        // Call the face_scan.py script
        cmd := exec.Command("python3", "face_scan.py")
        err = cmd.Run()
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        // Determine the output file name based on what was written
        detectedFileName := "detected_" + targetFileName

        // Call the face_data.py script to save data to a text file
        outputTxtFile := targetFileName[:len(targetFileName)-len(".jpg")] + ".txt"
        if targetFileName == "logout.jpg" || !updateOriginTxt {
            cmd = exec.Command("python3", "face_data.py", targetFileName, outputTxtFile)
            err = cmd.Run()
            if err != nil {
                http.Error(w, err.Error(), http.StatusInternalServerError)
                return
            }
        }

        // Check if the output of the face_scan.py script exists
        if _, err := os.Stat(detectedFileName); err == nil {
            // If the file exists, you can further process it or respond
            w.Write([]byte("File uploaded and processed successfully"))
        } else {
            http.Error(w, detectedFileName+" not found", http.StatusInternalServerError)
            return
        }
    } else {
        w.WriteHeader(http.StatusBadRequest)
    }
}


func checkImageHandler(w http.ResponseWriter, r *http.Request) {
	// Check which image is available to send the correct file name back to the client
	var imageName string
	if _, err := os.Stat("detected_logout.jpg"); err == nil {
		imageName = "detected_logout.jpg"
	} else if _, err := os.Stat("detected_origin.jpg"); err == nil {
		imageName = "detected_origin.jpg"
	}

	if imageName != "" {
		w.Write([]byte(imageName))
	} else {
		http.Error(w, "No processed image available", http.StatusNotFound)
	}
}

func encryptHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		cmd := exec.Command("python3", "encrypt.py")
		err := cmd.Run()
		if err != nil {
			http.Error(w, "Encryption failed", http.StatusInternalServerError)
			return
		}
		w.Write([]byte("Encryption process completed successfully"))
	} else {
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func decryptHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		cmd := exec.Command("python3", "decrypt.py")
		err := cmd.Run()
		if err != nil {
			http.Error(w, "Decryption failed", http.StatusInternalServerError)
			return
		}
		w.Write([]byte("Decryption process completed successfully"))
	} else {
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func main() {
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)
	http.HandleFunc("/upload", uploadHandler)
	http.HandleFunc("/check-image", checkImageHandler)
	http.HandleFunc("/encrypt", encryptHandler)
	http.HandleFunc("/decrypt", decryptHandler)

	log.Println("Listening on :8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
