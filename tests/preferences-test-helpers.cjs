/** Shared, visible settings flow replacing the retired top-bar language shortcut. */
exports.toggleLanguage = async (page) => {
  const next=await page.evaluate(()=>document.documentElement.lang==='en'?'zh':'en');
  await page.locator('.preferences-launch').click();
  await page.locator('[data-category-link=reading]').click();
  await page.locator('#pref-language').selectOption(next);
  await page.locator('.preferences-heading md-outlined-button').click();
  await page.locator('.preferences-dialog').waitFor({state:'hidden'});
};
exports.setRange = async (page,name,value) => {
  await page.locator('#pref-'+name).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
};
