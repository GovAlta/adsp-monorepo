package ca.ab.gov.alberta.adsp.sdk.metadata;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@ExtendWith(MockitoExtension.class)
class MetadataControllerTests {
  @Test
  public void canGetMetadata(@Mock ServletUriComponentsBuilder builder) throws URISyntaxException {
    try (MockedStatic<ServletUriComponentsBuilder> utilities = Mockito
        .mockStatic(ServletUriComponentsBuilder.class)) {

      var metadata = AdspMetadata.builder()
          .withName("test-service")
          .withDescription("Test service")
          .withHealthPath("/health")
          .withDocsPath("/docs")
          .withApiPath("/api")
          .build();

      utilities.when(ServletUriComponentsBuilder::fromCurrentRequestUri).thenReturn(builder);
      when(builder.build("")).thenReturn(new URI("https://test-service"));

      var controller = new MetadataController(metadata);
      var result = controller.getMetadata();
      assertEquals(result.getName(), metadata.getName());
      assertEquals(result.getDescription(), metadata.getDescription());
    }
  }
}
