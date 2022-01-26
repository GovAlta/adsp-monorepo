import { getHeaderPreview, getFooterPreview } from '../events';
const hasProperHtmlWrapper = (content: string): boolean => {
  return content.trim().startsWith('<!doctype html>') || content.trim().startsWith('<html>');
};

const isPlainText = (content:string):boolean =>{
  const htmlReg = new RegExp(htmlTags.map(tag => `<${tag}\\b[^>]*>`).join('|'), 'i');
  return !htmlReg.test(content);
}

const htmlTags=["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark","math","menu","menuitem","meta","meter","nav","noscript","object","ol","optgroup","option","output","p","param","picture","pre","progress","q","rb","rp","rt","rtc","ruby","s","samp","script","section","select","slot","small","source","span","strong","style","sub","summary","sup","svg","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","u","ul","var","video","wbr"];

export const getTemplateBody = (body: string, serviceName: string) => {
  if (!hasProperHtmlWrapper(body) && !isPlainText(body)) {
    return `<!doctype html><html>${getHeaderPreview()}${body}${getFooterPreview(serviceName)}</html>`;
  }
  return body;
};
