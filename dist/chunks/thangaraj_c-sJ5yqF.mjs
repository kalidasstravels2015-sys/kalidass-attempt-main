const thangaraj = new Proxy({"src":"/_astro/thangaraj.CtTx3RrL.jpg","width":1131,"height":1414,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/thangaraj.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/thangaraj.jpg");
							return target[name];
						}
					});

export { thangaraj as default };
