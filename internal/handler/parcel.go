package handler

import (
	"net/http"
	"strings"

	"crm-backend/internal/domain"
	"crm-backend/internal/handler/dto"
	"crm-backend/internal/service"
	"crm-backend/pkg/pagination"

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

func (h *ParcelHandler) List(c *gin.Context) {
	var req dto.ListParcelsRequest

	if err := c.ShouldBindQuery(&req); err != nil {
		writeValidationError(c, err)
		return
	}

	params := pagination.NewParams(req.Page, req.Limit)

	var status *domain.Status
	if req.Status != "" {
		parcelStatus := domain.Status(req.Status)
		status = &parcelStatus
	}

	parcels, total, err := h.parcelService.List(
		c.Request.Context(),
		status,
		params,
	)
	if err != nil {
		writeAppError(c, "list parcels failed", err)
		return
	}

	c.JSON(http.StatusOK, dto.ListParcelsResponse{
		Items: parcelResponses(parcels),
		Meta:  pagination.NewMeta(params.Page, params.Limit, total),
	})
}

func (h *ParcelHandler) GetByTrackNumber(c *gin.Context) {
	trackNumber := strings.TrimSpace(c.Param("track_number"))
	if trackNumber == "" {
		writeError(c, http.StatusBadRequest, errorCodeInvalidRequest, "invalid track number")
		return
	}

	parcel, err := h.parcelService.GetByTrackNumber(c.Request.Context(), trackNumber)
	if err != nil {
		writeAppError(c, "get parcel by track number failed", err)
		return
	}

	c.JSON(http.StatusOK, parcelResponse(*parcel))
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

func parcelResponses(parcels []domain.Parcel) []dto.ParcelResponse {
	responses := make([]dto.ParcelResponse, 0, len(parcels))

	for _, parcel := range parcels {
		responses = append(responses, parcelResponse(parcel))
	}

	return responses
}

func parcelResponse(parcel domain.Parcel) dto.ParcelResponse {
	return dto.ParcelResponse{
		ID:          parcel.ID,
		TrackNumber: parcel.TrackNumber,
		Status:      dto.ParcelStatus(parcel.Status),
		CreatedAt:   parcel.CreatedAt,
		UpdatedAt:   parcel.UpdatedAt,
	}
}
