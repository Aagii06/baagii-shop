import lodash from "lodash";

export const getValue = (obj: any, fieldName: string): any => {
  try {
    const val = lodash.get(obj, fieldName);
    if (val === undefined) {
      return null;
    }
    return val;
  } catch (ex) {
    return null;
  }
};

export const sleep = async (msec: number) => {
  return new Promise((resolve) => setTimeout(resolve, msec));
};

export const formatMoney = (n: number) => {
  return (Number(n) || 0).toLocaleString("en-US");
};

// export const getFileSrc = async function (
//   file: File
// ): Promise<string | ArrayBuffer | null> {
//   return new Promise((resolve, reject) => {
//     let reader = new FileReader();
//     reader.onload = () => {
//       resolve(reader.result);
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// };

export const numberFormat = (value: number, number?: number): string => {
  value = Number(value) || 0;
  return value && value.toFixed
    ? value
        .toFixed(number != undefined ? parseInt(number.toString()) : 2)
        .replace(/\d(?=(\d{3})+\.)/g, "$&,")
    : "0";
};

export const sumFormat = (data: any) => {
  return `${numberFormat(Number(data.value))}`;
};

export const countFormat = (data: any) => {
  return `Нийт: ${numberFormat(Number(data.value))} ш`;
};

export const dateFormat = (dateStr: string) => {
  if (dateStr) {
    return new Date(dateStr)
      .toISOString()
      .replace(/Z/g, "")
      .replace(/T/g, " ")
      .replace(".000", "");
  }
  return "";
};

// export const getFilterArrayByObject = ({
//   filterData,
//   joinOperator,
//   fieldOperator,
// }) => {
//   const filter = [];
//   Object.keys(filterData).map((key) => {
//     if (filterData[key]) {
//       if (filter.length > 0) {
//         filter.push(joinOperator);
//       }
//       const op = fieldOperator && fieldOperator[key] ? fieldOperator[key] : "=";
//       filter.push([key, op, filterData[key]]);
//     }
//   });
//   return filter;
// };

export const sum = (arr: Array<any>, field: string) => {
  return arr.reduce((a, b) => a + Number(b[field]), 0);
};

export const getUnicodeName = (name: string): string => {
  name = name
    ? name
        .toString()
        .trim()
        .toLowerCase()
        .replace(new RegExp(" ", "g"), "_")
        .replace(new RegExp("-", "g"), "_")
    : "";
  var cyrillic =
    "Ү_Ө_А_Б_В_Г_Д_Ђ_Е_Ё_Ж_З_И_Й_Ј_К_Л_Љ_М_Н_Њ_О_П_Р_С_Т_Ћ_У_Ф_Х_Ц_Ч_Џ_Ш_Щ_Ъ_Ы_Ь_Э_Ю_Яx".split(
      "_",
    );
  var latin =
    "U_U_A_B_V_G_D_Đ_E_Ë_J_Z_I_I_J_K_L_Lj_M_N_Nj_O_P_R_S_T_Ć_U_F_H_TS_CH_Dž_SH_Ŝ_ʺ_Ii_ʹ_E_Yu_Ya".split(
      "_",
    );
  let text = name
    .split("")
    .map(function (char) {
      var index = cyrillic.indexOf(char);
      if (!~index) {
        var indexLower = cyrillic.indexOf(char.toUpperCase());
        if (!~indexLower) {
          return char;
        }
        return latin[indexLower].toLowerCase();
      }
      return latin[index];
    })
    .join("");
  return text;
};
