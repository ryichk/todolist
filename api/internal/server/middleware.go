package server

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

func AuthMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			jwtBase64 := extractJWTFromHeader(c.Request())
			if jwtBase64 == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "JWT is required")
			}

			claims, err := validateJWT(jwtBase64)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, err)
			}
			c.Set("userID", claims.Subject)

			return next(c)
		}
	}
}

type CustomClaims struct {
	jwt.RegisteredClaims
}

func validateJWT(jwtBase64 string) (*CustomClaims, error) {
	regionID := os.Getenv("AWS_REGION")
	userPoolID := os.Getenv("COGNITO_USER_POOL_ID")

	jwksURL := fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json", regionID, userPoolID)
	jwks, err := keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		log.Printf("Failed to create JWK Set from resource at the given URL.\nError: %v", err)
		return nil, errors.New("Failed to create JWT Set")
	}

	issuer := fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s", regionID, userPoolID)
	token, err := jwt.ParseWithClaims(jwtBase64, &CustomClaims{}, jwks.Keyfunc, jwt.WithExpirationRequired(), jwt.WithIssuer(issuer))
	if err != nil {
		log.Printf("Failed to parse the JWT.\nError: %v", err)
		return nil, errors.New("Failed to parse the JWT")
	}
	if !token.Valid {
		log.Println("The token is invalid.")
		return nil, errors.New("The token is invalid")
	}
	claims, ok := token.Claims.(*CustomClaims)
	if !ok {
		log.Println("The token has invalid claims.")
		return nil, errors.New("The token has invalid claims")
	}
	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
		log.Println("The token has expired.")
		return nil, errors.New("The token has expired")
	}
	if claims.NotBefore != nil && claims.NotBefore.After(time.Now()) {
		log.Println("The token is not valid yet.")
		return nil, errors.New("The token is not valid yet")
	}

	return claims, nil
}

func extractJWTFromHeader(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		return authHeader[7:]
	}
	return ""
}
