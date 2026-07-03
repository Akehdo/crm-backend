package handler

import (
	"crm-backend/internal/domain"
	"crm-backend/internal/handler/dto"
	"crm-backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RecordHandler struct {
	service service.RecordService
}

func NewRecordHandler(service service.RecordService) *RecordHandler {
	return &RecordHandler{service: service}
}

func (h *RecordHandler) Create(ctx *gin.Context) {
	var req dto.CreateRecordRequest

	if !bindJSON(ctx, &req) {
		return
	}

	record := &domain.Record{
		ClientCode:   req.ClientCode,
		TrackNumbers: req.TrackNumbers,
		Weight:       req.Weight,
		Price:        req.Price,
		PaymentType:  domain.PaymentType(req.PaymentType),
	}

	err := h.service.Create(ctx.Request.Context(), record)
	if err != nil {
		writeAppError(ctx, "create record", err)
		return
	}

	ctx.JSON(http.StatusCreated, dto.MessageResponse{
		Message: "record created successfully",
	})
}
