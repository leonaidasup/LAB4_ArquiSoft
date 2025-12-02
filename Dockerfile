# Fase de Construcción: Usamos una imagen con JDK para compilar
FROM eclipse-temurin:17-jdk-focal as builder

# Directorio de trabajo
WORKDIR /app

# Copia los archivos de Maven y descarga las dependencias
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline

# Copia el código fuente y empaqueta
COPY src ./src
RUN ./mvnw package -DskipTests

# -------------------------------------------------------------------------
# Fase de Ejecución: Usa una imagen más ligera (JRE) para el despliegue final
# -------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-focal

WORKDIR /app

# Copia el JAR generado
COPY --from=builder /app/target/*.jar lab4v.jar

# Puertos expuestos: 8088 (App) y 8080 (Actuator/Prometheus)
EXPOSE 8088
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "lab4v.jar"]