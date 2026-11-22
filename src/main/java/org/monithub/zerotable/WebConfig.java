package org.monithub.zerotable;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/assessments").allowedOrigins("*").allowedMethods("POST","OPTIONS").allowedHeaders("*").maxAge(3600);
        registry.addMapping("/api/**").allowedOrigins("*").allowedMethods("GET","OPTIONS").allowedHeaders("*").maxAge(3600);
    }
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI().info(new Info().title("ZERO TABLE 공공데이터 API").version("0.1.0")
            .description("SQLite 수집 데이터 조회, 공공 API 프록시, 창업 설문 점수 계산을 제공합니다. 인증 불필요. 평가는 초기 설계 규칙이며 자료 부족 시 총점을 보류합니다. 상권영역 좌표는 EPSG:5181이며 위경도가 아닙니다. 서울시·부동산원·소상공인시장진흥공단 출처를 표시하세요."))
            .servers(List.of(new Server().url("/").description("현재 서버"),new Server().url("https://webframework.monithub.org").description("운영")));
    }
}
