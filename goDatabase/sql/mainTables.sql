
drop table if exists userInfo cascade;

-- Create User table (OAuth2 adaptation)
create table userInfo (
    userID SERIAL NOT NULL PRIMARY KEY, -- internal userID for your system
    googleUserID VARCHAR(255) NOT NULL UNIQUE, -- Google OAuth2 user ID
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    userEmail VARCHAR(255) NOT NULL UNIQUE, -- Email from Google
    signupDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Sign-up date
    lastLogin TIMESTAMP NOT NULL, -- Last login time (OAuth authentication time)
    googleAuthToken VARCHAR(512), -- Store the Google OAuth2 token if needed
    bucketName VARCHAR(255) UNIQUE, -- MinIO bucket name for the user
    faceScanned BOOLEAN DEFAULT FALSE,
    profilePicture VARCHAR(512); -- Store the Google profile picture URL
);

drop table if exists Folder cascade;

-- Create Folder table
CREATE TABLE Folder (
    folderID SERIAL NOT NULL PRIMARY KEY,
    folderName VARCHAR(255) NOT NULL,
    creationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    userID INT NOT NULL, -- reference to internal userID
    parentFolderID INT,
    FOREIGN KEY (userID) REFERENCES userInfo(userID) ON DELETE CASCADE,
    FOREIGN KEY (parentFolderID) REFERENCES Folder(folderID) ON DELETE SET NULL
);

drop table if exists Files cascade;

-- Create Files table
CREATE TABLE Files (
    fileName VARCHAR(255) NOT NULL,
    fileType VARCHAR(50) NOT NULL,
    fileSize BIGINT NOT NULL,
    uploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModifiedData TIMESTAMP NOT NULL,
    folderID INT,
    userID INT,
    PRIMARY KEY (fileName, folderID, userID),
    FOREIGN KEY (folderID) REFERENCES Folder(folderID) ON DELETE CASCADE,
    FOREIGN KEY (userID) REFERENCES userInfo(userID) ON DELETE CASCADE
);

drop table if exists faceAuthentication cascade;

-- Create faceAuthentication table
CREATE TABLE faceAuthentication (
    faceID SERIAL NOT NULL PRIMARY KEY,
    featureVector DOUBLE PRECISION[] NOT NULL,
    regDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUsed TIMESTAMP NOT NULL,
    userID INT NOT NULL,
    FOREIGN KEY (userID) REFERENCES userInfo(userID) ON DELETE CASCADE
);

