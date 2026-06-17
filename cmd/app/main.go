package main

import (
	"crm-backend/internal/app"
	"log"
)

func main() {
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
