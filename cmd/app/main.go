package main

import (
	"crm-backend/internal/database"
	"crm-backend/internal/domain"
	"log"
)

func main() {
	db := database.ConnectDatabase()

	err := db.AutoMigrate(&domain.User{})
	if err != nil {
		log.Fatal("failed to migrate database: ", err)
	}

	log.Println("Database connected and migrated successfully")
}
