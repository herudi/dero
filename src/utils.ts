import { HttpRequest } from "./http_request.ts";
import { HttpResponse } from "./http_response.ts";
import { NextFunction } from "./types.ts";

export const JSON_TYPE_CHARSET = "application/json; charset=utf-8";

export function findFns(arr: any[]): any[] {
  let ret = [] as any, i = 0, len = arr.length;
  for (; i < len; i++) {
    if (Array.isArray(arr[i])) ret = ret.concat(findFns(arr[i]));
    else if (typeof arr[i] === "function") ret.push(arr[i]);
  }
  return ret;
}
export function modPath(prefix: string) {
  return function (req: HttpRequest, res: HttpResponse, next: NextFunction) {
    req.url = req.url.substring(prefix.length) || "/";
    req.path = req.path ? req.path.substring(prefix.length) || "/" : "/";
    next();
  };
}
export async function existStat(filename: string) {
  try {
    let stats: Deno.FileInfo = await Deno.stat(filename);
    return stats;
  } catch (error) {
    return error;
  }
}
export function toBytes(arg: string | number) {
  let sizeList = {
    b: 1,
    kb: 1 << 10,
    mb: 1 << 20,
    gb: 1 << 30,
    tb: Math.pow(1024, 4),
    pb: Math.pow(1024, 5),
  } as Record<string, any>;
  if (typeof arg === "number") return arg;
  let arr = (/^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i).exec(arg),
    val: any,
    unt = "b";
  if (!arr) {
    val = parseInt(val, 10);
    unt = "b";
  } else {
    val = parseFloat(arr[1]);
    unt = arr[4].toLowerCase();
  }
  return Math.floor(sizeList[unt] * val);
}
export function toPathx(path: string | RegExp, isAny: boolean) {
  if (path instanceof RegExp) return { params: null, pathx: path };
  let trgx = /\?|\*|\./;
  if (!trgx.test(path) && isAny === false) {
    let len = (path.match(/\/:/gi) || []).length;
    if (len === 0) return;
    if (len === 1) {
      let arr = path.split("/:");
      if (arr[arr.length - 1].indexOf("/") === -1) {
        return { params: arr[1], key: arr[0] + "/:p", pathx: null };
      }
    }
  }
  let params: any[] | string | null = [],
    pattern = "",
    strReg = "/([^/]+?)",
    strRegQ = "(?:/([^/]+?))?";
  if (trgx.test(path)) {
    let arr = path.split("/"), obj: string | any[], el: string, i = 0;
    arr[0] || arr.shift();
    for (; i < arr.length; i++) {
      obj = arr[i];
      el = obj[0];
      if (el === "*") {
        params.push("wild");
        pattern += "/(.*)";
      } else if (el === ":") {
        let isQuest = obj.indexOf("?") !== -1, isExt = obj.indexOf(".") !== -1;
        if (isQuest && !isExt) pattern += strRegQ;
        else pattern += strReg;
        if (isExt) {
          let _ext = obj.substring(obj.indexOf("."));
          let _pattern = pattern + (isQuest ? "?" : "") + "\\" + _ext;
          _pattern = _pattern.replaceAll(
            strReg + "\\" + _ext,
            "/([\\w-]+" + _ext + ")",
          );
          pattern = _pattern;
        }
      } else pattern += "/" + obj;
    }
  } else pattern = path.replace(/\/:[a-z_-]+/gi, strReg);
  let pathx = new RegExp(`^${pattern}/?$`, "i"),
    matches = path.match(/\:([a-z_-]+)/gi);
  if (!params.length) {
    params = matches && matches.map((e: string) => e.substring(1));
  } else {
    let newArr = matches ? matches.map((e: string) => e.substring(1)) : [];
    params = newArr.concat(params);
  }
  return { params, pathx };
}
export function findBase(pathname: string) {
  let iof = pathname.indexOf("/", 1);
  if (iof !== -1) return pathname.substring(0, iof);
  return pathname;
}

function needPatch(data: any, keys: any, value: any) {
  if (keys.length === 0) {
    return value;
  }
  let key = keys.shift();
  if (!key) {
    data = data || [];
    if (Array.isArray(data)) {
      key = data.length;
    }
  }
  let index = +key;
  if (!isNaN(index)) {
    data = data || [];
    key = index;
  }
  data = data || {};
  let val = needPatch(data[key], keys, value);
  data[key] = val;
  return data;
}

export function myParse(arr: any[]) {
  let obj = arr.reduce((red: any, [field, value]: any) => {
    if (red.hasOwnProperty(field)) {
      if (Array.isArray(red[field])) {
        red[field] = [...red[field], value];
      } else {
        red[field] = [red[field], value];
      }
    } else {
      let [_, prefix, keys] = field.match(/^([^\[]+)((?:\[[^\]]*\])*)/);
      if (keys) {
        keys = Array.from(keys.matchAll(/\[([^\]]*)\]/g), (m: any) => m[1]);
        value = needPatch(red[prefix], keys, value);
      }
      red[prefix] = value;
    }
    return red;
  }, {});
  return obj;
}

export function myParseQuery(query: any) {
  if (query === null) return {};
  if (typeof query === "string") {
    let data = new URLSearchParams("?" + query);
    return myParse(Array.from(data.entries()));
  }
  return myParse(Array.from(query.entries()));
}
