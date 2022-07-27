namespace Adsp.Sdk.Access;
public interface ITokenProvider
{
  Task<string> GetAccessToken();
}
