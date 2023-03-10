package ca.ab.gov.alberta.adsp.sdk.metadata;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ExtendWith(MockitoExtension.class)
class MetadataReactiveControllerTests {
  @Test
  public void canGetMetadata(@Mock ServletUriComponentsBuilder builder, @Mock ServerHttpRequest request)
      throws URISyntaxException {

    var metadata = AdspMetadata.builder()
        .withName("test-service")
        .withDescription("Test service")
        .withHealthPath("/health")
        .withDocsPath("/docs")
        .withApiPath("/api")
        .build();

    when(request.getURI()).thenReturn(new URI("https://test-service"));

    var controller = new MetadataReactiveController(metadata);
    var result = controller.getMetadata(request).blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get().getName(), metadata.getName());
    assertEquals(result.get().getDescription(), metadata.getDescription());
  }
}
