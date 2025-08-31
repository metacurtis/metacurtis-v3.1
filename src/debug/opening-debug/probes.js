export const probes = {
  dumpUniforms() {
    const u = window.__consciousnessMaterial?.uniforms || {};
    console.log("UNIFORMS",
      "morph", u.uMorphProgress?.value,
      "pointSize", u.uPointSize?.value,
      "active", u.uActiveCount?.value
    );
  },
  dumpGeoBounds() {
    const geo = window.__particleGeometry;
    if (!geo) return console.warn("No particle geometry yet");
    const A = geo.getAttribute("atmosphericPosition");
    const T = geo.getAttribute("text3DPosition") || geo.getAttribute("text3DPosition");
    const calc = (arr)=>{let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
      for (let i=0;i<arr.length;i+=3){const x=arr[i],y=arr[i+1];
        if (x<minX)minX=x;if (x>maxX)maxX=x;if (y<minY)minY=y;if (y>maxY)maxY=y;}
      return {w:+(maxX-minX).toFixed(1),h:+(maxY-minY).toFixed(1)};
    };
    console.log("BOUNDS",
      "atmos", A ? calc(A.array) : null,
      "text ", T ? calc(T.array) : null
    );
  },
  assertMorphAlignment() {
    const geo = window.__particleGeometry;
    const A = geo?.getAttribute("atmosphericPosition")?.array;
    const T = geo?.getAttribute("text3DPosition")?.array;
    if (!A || !T) return console.warn("Missing source/target attrs");
    if (A.length !== T.length) console.error("Length mismatch", A.length, T.length);
  }
};
