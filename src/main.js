import $App from "./application/AppConfigurations";
import {worker} from "./__mock_data__/browser";
import {entryPoint} from "./presentation/utils/Router";
import {attachNavigationEvent} from "./presentation/utils/EventBinding";

const store = new $App.Store();

const _ = worker.start()

entryPoint()

// store.clear()
