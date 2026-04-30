/**
 * cropImageUtils 工具函数单元测试
 *
 * 覆盖范围：
 *  ─ getCroppedImg 正常流程
 *    1.  调用后返回 Blob Object URL（以 blob: 开头）
 *    2.  使用正确参数调用 ctx.drawImage
 *    3.  canvas.width / canvas.height 被设置为 pixelCrop 的 width / height
 *    4.  使用 'image/jpeg' 格式调用 toBlob
 *    5.  返回的 URL 由 URL.createObjectURL 生成
 *  ─ getCroppedImg 异常流程
 *    6.  图片加载失败（error 事件）时 Promise reject
 *    7.  canvas.getContext('2d') 返回 null 时抛出 'Canvas context not available'
 *    8.  toBlob 返回 null 时抛出 'Canvas toBlob 返回空值'
 *  ─ crossOrigin 属性
 *    9.  图片元素设置了 crossOrigin='anonymous'
 *  ─ 图片 src 赋值
 *    10. 图片元素 src 被赋值为传入的 imageSrc
 *  ─ drawImage 参数校验
 *    11. drawImage 第一个参数为 HTMLImageElement
 *  ─ 不同 pixelCrop 值
 *    12-14. 多种裁剪区域均能正常处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Area } from 'react-easy-crop';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：标准裁剪区域
// ─────────────────────────────────────────────────────────────────────────────
const PIXEL_CROP: Area = { x: 10, y: 20, width: 100, height: 80 };
const IMAGE_SRC = 'data:image/png;base64,abc123';

// ─────────────────────────────────────────────────────────────────────────────
// 追踪数据
// ─────────────────────────────────────────────────────────────────────────────
let drawImageArgs: unknown[] = [];
let lastCanvas: HTMLCanvasElement | null = null;
let mockBlob: Blob | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// 创建可以在测试中手动触发 load/error 的 Image 构造函数
// Vitest 要求 spyOn 的 mockImplementation 必须是 class 或 function（可以 new 的）
// ─────────────────────────────────────────────────────────────────────────────

type ImageCallback = (event: Event) => void;

interface MockImageInstance extends EventTarget {
  src: string;
  crossOrigin: string;
  _loadCallbacks: ImageCallback[];
  _errorCallbacks: ImageCallback[];
  _triggerLoad: () => void;
  _triggerError: () => void;
}

/** 收集创建的 MockImage 实例，供测试手动触发事件 */
let lastMockImageInstance: MockImageInstance | null = null;

/** 是否触发 error（而非 load） */
let triggerError = false;

function createMockImageClass() {
  function MockImage(this: MockImageInstance) {
    // 用 EventTarget 作为 prototype base 使得 addEventListener/dispatchEvent 可用
    this._loadCallbacks = [];
    this._errorCallbacks = [];
    lastMockImageInstance = this;

    this.addEventListener = (type: string, cb: EventListenerOrEventListenerObject) => {
      const fn = typeof cb === 'function' ? cb : cb.handleEvent.bind(cb);
      if (type === 'load') this._loadCallbacks.push(fn as ImageCallback);
      if (type === 'error') this._errorCallbacks.push(fn as ImageCallback);
    };

    this._triggerLoad = () => {
      this._loadCallbacks.forEach((cb) => cb(new Event('load')));
    };

    this._triggerError = () => {
      this._errorCallbacks.forEach((cb) => cb(new Event('error')));
    };

    let _src = '';
    let _crossOrigin = '';

    Object.defineProperty(this, 'crossOrigin', {
      get: () => _crossOrigin,
      set: (v: string) => { _crossOrigin = v; },
      configurable: true,
    });

    Object.defineProperty(this, 'src', {
      get: () => _src,
      set: (v: string) => {
        _src = v;
        // 异步触发，模拟真实图片加载
        Promise.resolve().then(() => {
          if (triggerError) {
            this._triggerError();
          } else {
            this._triggerLoad();
          }
        });
      },
      configurable: true,
    });
  }

  return MockImage as unknown as typeof Image;
}

beforeEach(() => {
  mockBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
  drawImageArgs = [];
  lastCanvas = null;
  lastMockImageInstance = null;
  triggerError = false;

  // ── mock Image constructor
  const MockImageCtor = createMockImageClass();
  vi.spyOn(globalThis, 'Image').mockImplementation(function () {
    return new MockImageCtor() as HTMLImageElement;
  } as unknown as typeof Image);

  // ── mock canvas getContext
  const mockCtx = {
    drawImage: vi.fn((...args: unknown[]) => { drawImageArgs = args; }),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((type: string) => {
    if (type === '2d') return mockCtx as unknown as CanvasRenderingContext2D;
    return null;
  });

  // ── mock canvas toBlob
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    function (this: HTMLCanvasElement, callback: BlobCallback, type?: string) {
      lastCanvas = this;
      void type;
      callback(mockBlob);
    },
  );

  // ── mock URL.createObjectURL
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-url');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// 每次需要重新 import getCroppedImg 让 mock 生效（ESM module cache）
// 在同一文件内直接引入，mock 在 beforeEach 里覆写全局，导入一次即可
// ─────────────────────────────────────────────────────────────────────────────
import { getCroppedImg } from '../ImageCropModal/cropImageUtils';

// ─── 1. 正常流程 ──────────────────────────────────────────────────────────────
describe('getCroppedImg – 正常流程', () => {
  it('返回 Blob Object URL（以 blob: 开头）', async () => {
    const result = await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    expect(result).toMatch(/^blob:/);
  });

  it('返回 URL 由 URL.createObjectURL 生成', async () => {
    const result = await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    expect(result).toBe('blob:http://localhost/mock-url');
  });

  it('canvas.width 被设置为 pixelCrop.width', async () => {
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    expect(lastCanvas?.width).toBe(PIXEL_CROP.width);
  });

  it('canvas.height 被设置为 pixelCrop.height', async () => {
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    expect(lastCanvas?.height).toBe(PIXEL_CROP.height);
  });

  it('使用正确参数调用 ctx.drawImage', async () => {
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
    expect(drawImageArgs[1]).toBe(PIXEL_CROP.x);      // sx
    expect(drawImageArgs[2]).toBe(PIXEL_CROP.y);      // sy
    expect(drawImageArgs[3]).toBe(PIXEL_CROP.width);  // sw
    expect(drawImageArgs[4]).toBe(PIXEL_CROP.height); // sh
    expect(drawImageArgs[5]).toBe(0);                 // dx
    expect(drawImageArgs[6]).toBe(0);                 // dy
    expect(drawImageArgs[7]).toBe(PIXEL_CROP.width);  // dw
    expect(drawImageArgs[8]).toBe(PIXEL_CROP.height); // dh
  });

  it('使用 image/jpeg 格式调用 toBlob', async () => {
    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg');
  });

  it('drawImage 第一个参数是 Image 对象（具有 src / crossOrigin 属性）', async () => {
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    const img = drawImageArgs[0] as MockImageInstance;
    expect(img).toBeDefined();
    expect(img.src).toBe(IMAGE_SRC);
  });
});

// ─── 2. crossOrigin 属性 ──────────────────────────────────────────────────────
describe('getCroppedImg – crossOrigin', () => {
  it('图片元素设置了 crossOrigin="anonymous"', async () => {
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    const img = drawImageArgs[0] as MockImageInstance;
    expect(img.crossOrigin).toBe('anonymous');
  });
});

// ─── 3. src 赋值 ──────────────────────────────────────────────────────────────
describe('getCroppedImg – src 赋值', () => {
  it('图片元素 src 被赋值为传入的 imageSrc', async () => {
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    const img = drawImageArgs[0] as MockImageInstance;
    expect(img.src).toBe(IMAGE_SRC);
  });
});

// ─── 4. 异常流程 ──────────────────────────────────────────────────────────────
describe('getCroppedImg – 异常流程', () => {
  it('图片加载失败时 Promise reject', async () => {
    triggerError = true;
    await expect(getCroppedImg(IMAGE_SRC, PIXEL_CROP)).rejects.toBeDefined();
  });

  it('canvas.getContext 返回 null 时抛出 Canvas context not available', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(getCroppedImg(IMAGE_SRC, PIXEL_CROP)).rejects.toThrow('Canvas context not available');
  });

  it('toBlob 返回 null 时抛出 Canvas toBlob 返回空值', async () => {
    mockBlob = null;
    await expect(getCroppedImg(IMAGE_SRC, PIXEL_CROP)).rejects.toThrow('Canvas toBlob 返回空值');
  });

  it('Context 不可用时不调用 URL.createObjectURL', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    await getCroppedImg(IMAGE_SRC, PIXEL_CROP).catch(() => undefined);
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });
});

// ─── 5. 不同 pixelCrop 值 ─────────────────────────────────────────────────────
describe('getCroppedImg – 不同 pixelCrop', () => {
  it('pixelCrop x=0,y=0 时正常处理', async () => {
    const crop: Area = { x: 0, y: 0, width: 50, height: 50 };
    const result = await getCroppedImg(IMAGE_SRC, crop);
    expect(result).toBe('blob:http://localhost/mock-url');
  });

  it('pixelCrop 宽高为 1 时正常处理（极小裁剪）', async () => {
    const crop: Area = { x: 5, y: 5, width: 1, height: 1 };
    const result = await getCroppedImg(IMAGE_SRC, crop);
    expect(result).toBeTruthy();
  });

  it('多次调用独立返回不同 URL（URL.createObjectURL 多次调用）', async () => {
    const urlSpy = vi.spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:url-1')
      .mockReturnValueOnce('blob:url-2');

    const r1 = await getCroppedImg(IMAGE_SRC, PIXEL_CROP);
    const r2 = await getCroppedImg(IMAGE_SRC, { x: 0, y: 0, width: 20, height: 20 });

    expect(r1).toBe('blob:url-1');
    expect(r2).toBe('blob:url-2');
    expect(urlSpy).toHaveBeenCalledTimes(2);
  });
});

// ─── 6. 非方形裁剪区域 ────────────────────────────────────────────────────────
describe('getCroppedImg – 非方形裁剪区域', () => {
  it('宽大于高（横屏）时 canvas 尺寸正确', async () => {
    const crop: Area = { x: 0, y: 0, width: 200, height: 100 };
    await getCroppedImg(IMAGE_SRC, crop);
    expect(lastCanvas?.width).toBe(200);
    expect(lastCanvas?.height).toBe(100);
  });

  it('高大于宽（竖屏）时 canvas 尺寸正确', async () => {
    const crop: Area = { x: 0, y: 0, width: 100, height: 300 };
    await getCroppedImg(IMAGE_SRC, crop);
    expect(lastCanvas?.width).toBe(100);
    expect(lastCanvas?.height).toBe(300);
  });

  it('非方形时 drawImage 参数宽高与裁剪区一致', async () => {
    const crop: Area = { x: 5, y: 10, width: 320, height: 180 };
    await getCroppedImg(IMAGE_SRC, crop);
    expect(drawImageArgs[3]).toBe(320); // sw
    expect(drawImageArgs[4]).toBe(180); // sh
    expect(drawImageArgs[7]).toBe(320); // dw
    expect(drawImageArgs[8]).toBe(180); // dh
  });
});

// ─── 7. 浮点裁剪值 ───────────────────────────────────────────────────────────
describe('getCroppedImg – 浮点裁剪值', () => {
  it('浮点 x/y 时 drawImage sx/sy 使用原始浮点值', async () => {
    const crop: Area = { x: 0.5, y: 1.25, width: 100, height: 80 };
    await getCroppedImg(IMAGE_SRC, crop);
    expect(drawImageArgs[1]).toBe(0.5);
    expect(drawImageArgs[2]).toBe(1.25);
  });

  it('浮点 width/height 时 canvas 尺寸被截断为整数（HTMLCanvasElement.width 是整数属性）', async () => {
    // HTMLCanvasElement.width/height 是 unsigned long 整数，浮点赋值会被截断
    const crop: Area = { x: 0, y: 0, width: 99.5, height: 79.75 };
    await getCroppedImg(IMAGE_SRC, crop);
    // 99.5 → 99，79.75 → 79（浏览器/JSDOM 均截断）
    expect(lastCanvas?.width).toBe(Math.trunc(99.5));
    expect(lastCanvas?.height).toBe(Math.trunc(79.75));
  });

  it('浮点裁剪值最终仍返回 blob URL', async () => {
    const crop: Area = { x: 3.3, y: 7.7, width: 50.5, height: 40.2 };
    const result = await getCroppedImg(IMAGE_SRC, crop);
    expect(result).toMatch(/^blob:/);
  });
});

// ─── 8. 大尺寸裁剪区域 ───────────────────────────────────────────────────────
describe('getCroppedImg – 大尺寸裁剪区域', () => {
  it('4K 级尺寸（3840x2160）时正常处理', async () => {
    const crop: Area = { x: 0, y: 0, width: 3840, height: 2160 };
    const result = await getCroppedImg(IMAGE_SRC, crop);
    expect(result).toBeTruthy();
    expect(lastCanvas?.width).toBe(3840);
    expect(lastCanvas?.height).toBe(2160);
  });

  it('大尺寸 drawImage 参数正确', async () => {
    const crop: Area = { x: 100, y: 200, width: 1920, height: 1080 };
    await getCroppedImg(IMAGE_SRC, crop);
    expect(drawImageArgs[1]).toBe(100);
    expect(drawImageArgs[2]).toBe(200);
    expect(drawImageArgs[3]).toBe(1920);
    expect(drawImageArgs[4]).toBe(1080);
  });
});

// ─── 9. 多次调用独立性 ────────────────────────────────────────────────────────
describe('getCroppedImg – 多次调用独立性', () => {
  it('连续两次调用各自独立，不共享 canvas', async () => {
    const crop1: Area = { x: 0, y: 0, width: 50, height: 50 };
    const crop2: Area = { x: 10, y: 10, width: 100, height: 80 };

    await getCroppedImg(IMAGE_SRC, crop1);
    const canvas1Size = { w: lastCanvas!.width, h: lastCanvas!.height };

    await getCroppedImg(IMAGE_SRC, crop2);
    const canvas2Size = { w: lastCanvas!.width, h: lastCanvas!.height };

    expect(canvas1Size).toEqual({ w: 50, h: 50 });
    expect(canvas2Size).toEqual({ w: 100, h: 80 });
  });

  it('连续调用 drawImage 各自携带自己的坐标', async () => {
    const crop1: Area = { x: 5, y: 5, width: 40, height: 40 };
    const crop2: Area = { x: 20, y: 30, width: 60, height: 70 };

    await getCroppedImg(IMAGE_SRC, crop1);
    expect(drawImageArgs[1]).toBe(5);

    await getCroppedImg(IMAGE_SRC, crop2);
    expect(drawImageArgs[1]).toBe(20);
    expect(drawImageArgs[2]).toBe(30);
  });
});
