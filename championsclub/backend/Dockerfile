FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 championsclub
COPY --from=build /workspace/target/backend-1.0.0.jar app.jar
USER championsclub
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
