package handler

import (
	"net/http"

	"crm-backend/internal/domain"
	"crm-backend/internal/handler/dto"
	"crm-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ParcelHandler struct {
	parcelService service.ParcelService
}

func NewParcelHandler(parcelService service.ParcelService) *ParcelHandler {
	return &ParcelHandler{parcelService: parcelService}
}

func (h *ParcelHandler) Create(c *gin.Context) {
	var req dto.CreateParcelsRequest

	if !bindJSON(c, &req) {
		return
	}

	if err := h.parcelService.Create(c.Request.Context(), req.TrackNumbers); err != nil {
		writeAppError(c, "create parcels failed", err)
		return
	}

	c.JSON(http.StatusCreated, dto.MessageResponse{
		Message: "parcels created successfully",
	})
}

func (h *ParcelHandler) UpsertStatus(c *gin.Context) {
	var req dto.UpsertParcelsStatusRequest

	if !bindJSON(c, &req) {
		return
	}

	err := h.parcelService.UpsertStatus(
		c.Request.Context(),
		req.TrackNumbers,
		domain.Status(req.Status),
	)
	if err != nil {
		writeAppError(c, "upsert parcels status failed", err)
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "parcels status updated successfully",
	})
}
