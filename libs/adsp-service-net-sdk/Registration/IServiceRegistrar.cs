namespace Adsp.Sdk.Registration;

internal interface IServiceRegistrar
{
  Task Register(ServiceRegistration registration);

  DomainEventDefinition? GetEventDefinition(string name);
}
