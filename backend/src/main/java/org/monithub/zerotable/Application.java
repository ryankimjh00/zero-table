package org.monithub.zerotable;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Application {
    public static void main(String[] args) throws Exception {
        Path database = Path.of(System.getenv().getOrDefault("SQLITE_PATH", "./data/zero-table.db"));
        if (database.toAbsolutePath().getParent() != null) Files.createDirectories(database.toAbsolutePath().getParent());
        SpringApplication.run(Application.class, args);
    }
}
