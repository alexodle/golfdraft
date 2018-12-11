import pgatourReader from './pgatourReader';
import pgatourFieldReader from './pgatourFieldReader';
import pgaTourHistoricHtmlReader from './pgaTourHistoricHtmlReader';

export default {

  pgatour: {
    reader: pgatourReader
  },

  pgatour_field: {
    reader: pgatourFieldReader
  },

  pgatour_historic_html: {
    reader: pgaTourHistoricHtmlReader
  }

};
