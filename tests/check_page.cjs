async function test() {
  const res = await fetch('http://localhost:4321/services/tirupati-package/');
  const text = await res.text();
  const idx = text.indexOf('Enter pickup address');
  if (idx !== -1) {
    console.log('SUCCESS! Found pickup input HTML:', text.substring(idx - 50, idx + 200));
  } else {
    console.log('NOT FOUND! Island contents:', text.substring(text.indexOf('id="booking"'), text.indexOf('id="booking"') + 2000));
  }
}
test();
