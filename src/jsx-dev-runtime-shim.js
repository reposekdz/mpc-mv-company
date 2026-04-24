import React from 'react';
import { jsx, jsxs, Fragment as F } from 'react/jsx-runtime';

export const Fragment = F;
export const jsxDEV = (type, props, key, _isStatic, _source, _self) => jsx(type, props, key);
