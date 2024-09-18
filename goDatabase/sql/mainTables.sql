--dropping all tables when running mainTables.sql
--if dont want to drop and remove tables
-- DONT RUN THIS

drop table if exists userInfo cascade;

-- create User table
create table userInfo(
    userID SERIAL NOT NULL PRIMARY KEY,
    userName VARCHAR(255) NOT NULL,
    userEmail VARCHAR(255) NOT NULL UNIQUE,
    userPassword VARCHAR(255) NOT NULL,
    signupData TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastLogin TIMESTAMP NOT NULL
);

drop table if exists Folder cascade;

-- create Folder table
CREATE TABLE Folder (
    folderID SERIAL NOT NULL PRIMARY KEY,
    folderName VARCHAR(255) NOT NULL,
    creationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    userID INT NOT NULL,
    parentFolderID INT,
    FOREIGN KEY (userID) REFERENCES userInfo(userID) ON DELETE CASCADE,
    FOREIGN KEY (parentFolderID) REFERENCES Folder(folderID) ON DELETE SET NULL
);


drop table if exists Files cascade;

-- create Files table
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

-- create faceAuthentication table
CREATE TABLE faceAuthentication (
    faceID SERIAL NOT NULL PRIMARY KEY,
    featureVector DOUBLE PRECISION[] NOT NULL,
    vectorFormat VARCHAR(50) NOT NULL,
    regData TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUsed TIMESTAMP NOT NULL,
    authToken VARCHAR(255),
    userID INT NOT NULL,
    FOREIGN KEY (userID) REFERENCES userInfo(userID) ON DELETE CASCADE
);
