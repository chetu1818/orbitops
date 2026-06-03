# Base runtime environment
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK build environment
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project file and local nuget configuration to resolve restore paths in container
COPY ["OrbitOps.Api.csproj", "OrbitOps.Api/"]
COPY ["nuget.config", "OrbitOps.Api/"]
WORKDIR "/src/OrbitOps.Api"
RUN dotnet restore "OrbitOps.Api.csproj"

# Copy remaining source code and build project
COPY . .
RUN dotnet build "OrbitOps.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish compiled files
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "OrbitOps.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final lean runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "OrbitOps.Api.dll"]
