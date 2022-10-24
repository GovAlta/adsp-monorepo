package ca.ab.gov.alberta.adsp.sdk.socket;

import java.util.ArrayList;
import java.util.Collection;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import ca.ab.gov.alberta.adsp.sdk.events.FullDomainEvent;

@Component
class SocketEventListenerBeanPostProcessor
    implements BeanPostProcessor, Ordered, SmartInitializingSingleton, DisposableBean {

  private final ServiceDirectory directory;
  private final TokenProvider tokenProvider;

  private final ArrayList<SocketEventListenerAdapter> adapters = new ArrayList<SocketEventListenerAdapter>();
  private final ArrayList<SocketEventClient> clients = new ArrayList<SocketEventClient>();

  public SocketEventListenerBeanPostProcessor(ServiceDirectory directory, TokenProvider tokenProvider) {
    this.directory = directory;
    this.tokenProvider = tokenProvider;
  }

  @Override
  public int getOrder() {
    return LOWEST_PRECEDENCE;
  }

  @Override
  @Nullable
  public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
    Class<?> targetClass = AopUtils.getTargetClass(bean);
    var adapters = this.buildAdapters(bean, targetClass);
    this.adapters.addAll(adapters);

    return BeanPostProcessor.super.postProcessAfterInitialization(bean, beanName);
  }

  private Collection<SocketEventListenerAdapter> buildAdapters(Object bean, Class<?> targetClass) {
    var adapters = new ArrayList<SocketEventListenerAdapter>();

    ReflectionUtils.doWithMethods(targetClass, method -> {
      var annotation = method.getAnnotation(SocketEventListener.class);
      if (annotation != null) {
        var streamId = StringUtils.isNotEmpty(annotation.streamId()) ? annotation.streamId() : annotation.value();
        if (StringUtils.isEmpty(streamId)) {
          throw new IllegalArgumentException("SocketEventListener annotation must include Stream ID.");
        }

        var parameterTypes = method.getParameterTypes();
        if (parameterTypes.length != 1 || parameterTypes[0] != FullDomainEvent.class) {
          throw new IllegalArgumentException(
              "SocketEventListener can only be applied to method that accepts a single argument of type FullDomainEvent.");
        }

        adapters.add(new SocketEventListenerAdapter(streamId, bean, method, annotation.payloadType()));
      }
    }, ReflectionUtils.USER_DECLARED_METHODS);

    return adapters;
  }

  @Override
  public void afterSingletonsInstantiated() {
    var adapters = this.adapters.stream().collect(Collectors.groupingBy(adapter -> adapter.getStreamId()));

    adapters.forEach((streamId, streamAdapters) -> {
      var client = new SocketEventClient(this.directory, this.tokenProvider, streamId, streamAdapters);
      this.clients.add(client);
    });

    this.clients.forEach(client -> client.connect().blockOptional());

    adapters.clear();
  }

  @Override
  public void destroy() throws Exception {
    this.clients.forEach(client -> client.disconnect().blockOptional());
  }
}
