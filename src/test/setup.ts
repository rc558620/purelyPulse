import '@testing-library/jest-dom';

// jsdom 未实现 Element.scrollTo（滚轮选择列等滚动定位组件依赖），
// 测试环境补 no-op 兜底；真实浏览器均原生支持，不影响线上行为。
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollTo !== 'function') {
  Element.prototype.scrollTo = (() => {}) as Element['scrollTo'];
}
