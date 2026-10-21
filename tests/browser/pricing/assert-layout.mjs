import assert from "node:assert/strict";

// Inspect geometry rather than Tailwind class names: clipping, overlap and text
// extending into card padding must fail even if the document has no scrollbar.
export async function assertPricingLayout(page, grid) {
  const results = await grid.locator("h3").evaluateAll((headings) => {
    const bounds = (element) => {
      const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
      return { left, top, right, bottom, width, height };
    };
    const inspect = (element) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        text: element.textContent,
        box: bounds(element),
        textRects: [...range.getClientRects()].map(({ left, top, right, bottom }) => ({ left, top, right, bottom })),
        clipped: ["hidden", "clip"].includes(style.overflowX) || ["hidden", "clip"].includes(style.overflowY)
          || style.textOverflow === "ellipsis" || !["none", ""].includes(style.webkitLineClamp),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    };
    return headings.map((heading) => {
      const header = heading.parentElement;
      const card = header.parentElement.parentElement;
      const style = getComputedStyle(card);
      const cardBox = bounds(card);
      return {
        card: cardBox,
        content: {
          left: cardBox.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
          right: cardBox.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
          top: cardBox.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop),
          bottom: cardBox.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom),
        },
        header: inspect(header),
        title: inspect(heading),
        badge: inspect(heading.nextElementSibling),
      };
    });
  });
  assert.equal(results.length, 3, "The comparison must retain all three cards");
  const inside = (inner, outer, message) => {
    assert(inner.left >= outer.left - 1 && inner.right <= outer.right + 1
      && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1, message);
  };
  for (const { content, header, title, badge } of results) {
    assert(!header.clipped, "The header must not hide overflow");
    for (const [name, element] of [["title", title], ["badge", badge]]) {
      if (!element) continue;
      const label = `${name}: ${element.text.slice(0, 90)}`;
      assert(element.box.width > 0 && element.box.height > 0, `${label} must be visible`);
      inside(element.box, content, `${label} must fit inside the card's content area`);
      assert(!element.clipped, `${label} must not be clipped or truncated`);
      assert(element.scrollWidth <= element.clientWidth + 1, `${label} must not overflow internally`);
      for (const rect of element.textRects) inside(rect, element.box, `${label} must show all text`);
    }
    if (badge) {
      assert(title.box.right <= badge.box.left + 1 || title.box.bottom <= badge.box.top + 1,
        "Title and badge must not overlap or reverse order");
      if (badge.box.top >= title.box.bottom - 1) {
        assert(Math.abs(badge.box.left - content.left) <= 1, "Wrapped badges must align left");
      }
    }
  }
  const width = page.viewportSize().width;
  const cards = results.map(({ card }) => card);
  if (width >= 1024) {
    assert(cards.every((card) => Math.abs(card.top - cards[0].top) <= 1), "Desktop must retain three columns");
    assert(cards[0].right <= cards[1].left && cards[1].right <= cards[2].left);
  } else {
    assert(cards[0].bottom <= cards[1].top && cards[1].bottom <= cards[2].top, "Mobile/tablet must retain one column");
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    "The page must not overflow horizontally");
  return results;
}
