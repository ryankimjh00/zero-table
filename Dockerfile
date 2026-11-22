FROM eclipse-temurin:17-jre-noble
WORKDIR /app
COPY target/zero-table-api.jar /app/app.jar
COPY config/collection-plan.json config/bootstrap-plan.json /app/config/
RUN mkdir -p /data && chown -R 10001:10001 /app /data
USER 10001:10001
ENV SQLITE_PATH=/data/zero-table.db JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -Djava.io.tmpdir=/tmp"
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
