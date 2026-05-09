export const sprintf = (format, ...args) => {
    let i = 0;
    return format.replace(/%s/g, () => String(args[i++]));
};
