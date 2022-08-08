namespace Adsp.Sdk;
public interface ITokenProvider
{
  Task<string> GetAccessToken();
}
