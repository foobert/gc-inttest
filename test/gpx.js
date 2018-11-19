/* eslint-env mocha */
const chai = require("chai");
const expect = chai.expect;
const request = require("superagent");
const xml2js = require("xml2js");

const TIMEOUT = 30000;

describe("GPX generation", () => {
  it("should be available on /api/poi.gpx", async () => {
    const res = await request("OPTIONS", url("/api/poi.gpx"));
    expect(res.ok).to.be.true;
  }).timeout(TIMEOUT);

  it("should serve an XML document", async () => {
    const res = await request
      .get(url("/api/poi.gpx"))
      .query({ type: "earth" })
      .buffer();

    expect(res.ok).to.be.true;
    expect(res.type).to.equal("application/gpx+xml");

    const xml = await parseXml(res.text);
    expect(xml).to.exist;

    // this is a bit rough, as proper XML would allow us to use different
    // namespacing, but it's good enough
    expect(xml.gpx.$.xmlns).to.equal("http://www.topografix.com/GPX/1/1");

    expect(xml.gpx.wpt.length).to.be.above(0);
    for (const wpt of xml.gpx.wpt) {
      expect(parseFloat(wpt.$.lat)).to.be.within(-90, 90);
      expect(parseFloat(wpt.$.lon)).to.be.within(-180, 180);
      expect(wpt.name).to.be.not.empty;
      expect(wpt.desc).to.be.not.empty;
      expect(wpt.cmt).to.be.not.empty;
      expect(wpt.type).to.equal("Geocache");
    }
  }).timeout(TIMEOUT);
});

function url(p) {
  const baseurl = process.env["GC_URL"] || "http://localhost:8080/";
  return baseurl + p;
}

function parseXml(text) {
  return new Promise((accept, reject) => {
    xml2js.parseString(
      text,
      { explicitArray: false },
      (err, result) => (err ? reject(err) : accept(result))
    );
  });
}
