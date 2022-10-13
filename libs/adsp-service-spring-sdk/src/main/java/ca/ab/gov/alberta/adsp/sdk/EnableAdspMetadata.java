package ca.ab.gov.alberta.adsp.sdk;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.context.annotation.Import;

import ca.ab.gov.alberta.adsp.sdk.metadata.AdspMetadataSupport;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Import(AdspMetadataSupport.class)
public @interface EnableAdspMetadata {
}
