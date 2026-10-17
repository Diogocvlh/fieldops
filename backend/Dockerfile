FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml ./
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system fieldops && useradd --system --gid fieldops fieldops
COPY --from=build --chown=fieldops:fieldops /build/target/fieldops-api-1.0.0.jar app.jar
USER fieldops
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
