# ---------- Build Stage ----------
FROM maven:3.9.8-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/postsales-backend-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=4000
EXPOSE ${PORT}

CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar --spring.profiles.active=prod"]