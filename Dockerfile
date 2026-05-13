# Use the official .NET SDK image for build-time compilation
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
ARG CONFIGURATION=Release

# Copy project files first for better Docker layer caching
COPY *.csproj ./
RUN dotnet restore "*.csproj"

# Copy the remaining source files and publish the application
COPY . ./
RUN dotnet publish "*.csproj" -c $CONFIGURATION -o /app/publish /p:UseAppHost=false

# Use the smaller ASP.NET runtime image for production
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose the default HTTP port and configure the runtime URL
EXPOSE 80
ENV ASPNETCORE_URLS=http://+:80

# Start the ASP.NET Core application
ENTRYPOINT ["dotnet", "timein.dll"]
