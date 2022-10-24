package ca.ab.gov.alberta.adsp.sdk.socket;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.Map;

import org.springframework.core.annotation.AliasFor;

/**
 * <p>
 * Indicates a method is a socket.io event listener for a push service stream.
 * </p>
 *
 * <p>
 * streamId (alias of value) of the annotation must be set indicating which
 * stream the listener wishes to connect on. The access token for the service
 * account must include the urn:ads:platform:push-service in the audience; this
 * can be configured using an Audience mapper in the associated Client.
 * </p>
 *
 */
@Target(ElementType.METHOD)
@Documented
@Retention(RetentionPolicy.RUNTIME)
public @interface SocketEventListener {

  /**
   * ID of the stream to listen on.
   *
   * @return ID of the stream.
   */
  @AliasFor("streamId")
  String value() default "";

  /**
   * ID of the stream to listen on.
   *
   * @return ID of the stream.
   */
  @AliasFor("value")
  String streamId() default "";

  /**
   * Class of the payload type for deserialization of the event.
   *
   * @return Class of the payload type.
   */
  Class<?> payloadType() default Map.class;
}
