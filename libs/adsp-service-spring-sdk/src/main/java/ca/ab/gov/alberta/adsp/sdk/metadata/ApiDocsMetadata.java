package ca.ab.gov.alberta.adsp.sdk.metadata;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springdoc.core.Constants;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnClass(Constants.class)
public class ApiDocsMetadata {

  @Value("${springdoc.api-docs.path:#{T(org.springdoc.core.Constants).DEFAULT_API_DOCS_URL}}")
  private String openApiPath;

  public String getOpenApiPath() {
    return openApiPath;
  }
}
