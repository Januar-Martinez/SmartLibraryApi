IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SmartLibraryDB')
BEGIN
    CREATE DATABASE SmartLibraryDB;
END
GO

USE SmartLibraryDB;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Members' AND xtype = 'U')
BEGIN
    CREATE TABLE Members (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name  NVARCHAR(100) NOT NULL,
        email NVARCHAR(150) NOT NULL UNIQUE,
        isActive BIT NOT NULL DEFAULT 1
    );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Books' AND xtype = 'U')
BEGIN
    CREATE TABLE Books (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title  NVARCHAR(100) NOT NULL,
        author NVARCHAR(150) NOT NULL,
        stock INT NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Loans' AND xtype = 'U')
BEGIN
    CREATE TABLE Loans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        memberId  INT NOT NULL,
        bookId INT NOT NULL,
        loanDate DATE NOT NULL DEFAULT GETDATE(),
        DueDate DATE NOT NULL,
        returnDate DATE NULL,
        status NVARCHAR(10) NOT NULL DEFAULT 'Active',

        CONSTRAINT CHK_LoanStatus CHECK (status IN ('Active', 'Overdue', 'Returned')),
        CONSTRAINT FK_Loans_Members FOREIGN KEY (memberId) REFERENCES Members(id),
        CONSTRAINT FK_Loans_Books FOREIGN KEY (bookId) REFERENCES Books(id)
    );
END
GO