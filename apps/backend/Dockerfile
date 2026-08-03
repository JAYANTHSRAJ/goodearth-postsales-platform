# ---------- Build Stage ----------
FROM maven:3.9.8-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/postsales-backend-0.0.1-SNAPSHOT.jar app.jar

ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -Xmx512m -XX:MaxMetaspaceSize=256m -Dserver.port=${PORT:-8080} -jar app.jar --spring.profiles.active=prod"]