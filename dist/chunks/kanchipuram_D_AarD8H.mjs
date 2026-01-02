const kanchipuram = new Proxy({"src":"/_astro/kanchipuram.OaWcFaxg.jpg","width":2048,"height":1362,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/hero/kanchipuram.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/hero/kanchipuram.jpg");
							return target[name];
						}
					});

export { kanchipuram as default };
