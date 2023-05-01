import View from "../../common/View";
import LabelViewModel from "../view_model/LabelViewModel";
import {getLabelTpl, getLabelItemTpl} from "../../../utils/tpl";  // View 렌더링 템플릿
import {$, renderWithTemplate} from "../../../utils/Render";
import {eventBind} from "../../../utils/EventBinding";
import Label from "../../../../domain/use_cases/label/Label";
import Store from "../../../../application/Store";

const ObserverList = Object.freeze({
  renderLabelList: 'renderLabelList',
  updateLabelStatus: 'updateLabelStatus',
  clearNewLabelForm: 'clearNewLabelForm'
})

let newLabelIsHidden = true
const newLabel = 'newLabel'

export default class LabelView extends View {

  constructor() {
    // MARK: init
    super('label initializer')
    this.renderApp(getLabelTpl())
    this.viewModel = new LabelViewModel()

    // MARK: ViewModel Render Binding
    this.viewModel.subscribe(ObserverList.renderLabelList, this.renderLabelList)
    this.viewModel.subscribe(ObserverList.updateLabelStatus, this.labelStatusTab)
    this.viewModel.subscribe(ObserverList.clearNewLabelForm, this.cancelNewLabelForm)
    this.getLabelList()


    // MARK: Event Action Binding
    this.eventListeners()

    // MARK: Dev Mock Data
    // mock__NewLabelFormData()
  }

  // COMMENT: Object.defineProperty 에서는 super 호출이 불가능하다. 상속 관련 함수는 모두 class 내부에 ES5 함수로 정의할 것!!
  openNewLabelForm() {
    super.toggleClassOff('#new-label-form', 'hidden')
    newLabelIsHidden = false
  }

  cancelNewLabelForm() {
    super.toggleClassOn('#new-label-form', 'hidden')
    $('#new-label-form').reset()
    newLabelIsHidden = true
    this.removeLabelAtDB()
  }

}

// MARK: Data

Object.defineProperty(LabelView.prototype, 'getLabelList', {
  value: function () {
    this.viewModel.getData()
  }
})

Object.defineProperty(LabelView.prototype, 'createLabelObject', {
  value: function () {
    const name = $('#label-name-input').value
    const description = $('#label-description-input').value
    const color = $('#label-color-value').value

    return new Label(name, description, color)
  }
})

// 버튼 클릭시 데이터 post 저장하는 이벤트 만들고 저장되면 다시 로딩이 아니라 ajax 만 처리
// TODO: 5초 지연에 따른 abort controller
// COMMENT: postLabel 메서드에 대한 bind 는 메서드를 정의하는 곳이 아니라 호출하는 곳에서 걸어댜 한다!!
LabelView.prototype.postLabel = function (evt) {
  evt.preventDefault()
  if (newLabelIsHidden) return
  const label = this.createLabelObject()
  this.viewModel.postData(label)
}

// MARK: Render

Object.defineProperty(LabelView.prototype, 'renderLabelList', {
  value: function (data) {
    return renderWithTemplate('#label-wrapper__ul')(getLabelItemTpl)(data)
  }
})

Object.defineProperty(LabelView.prototype, 'labelStatusTab', {
  value: function (data) {
    const labelCounter = $('#label-counter')
    labelCounter.textContent = `${data.length ?? 0} Labels`
  }
})

// MARK: Event Action

Object.defineProperty(LabelView.prototype, 'eventListeners', {
  value: function () {
    eventBind('#new-label-button', 'click', this.openNewLabelForm.bind(this))
    eventBind('#label-cancel-button', 'click', this.cancelNewLabelForm.bind(this))
    eventBind('#new-label-color', 'click', (evt) => {
      const color = Label.getRandomLabelColor()
      $('#label-color-value').value = color
      $('#label-preview').style.backgroundColor = color
      this.enableCreateLabelButton(evt)
    })
    eventBind('#new-label-form', 'keyup', evt => this.enableCreateLabelButton(evt))
    eventBind('#label-create-button', 'click', this.postLabel.bind(this))

    // MARK: Persistence Data
    window.addEventListener('beforeunload', this.beforeViewDestroyed.bind(this))
    // COMMENT: SPA 이기 때문에 'DOMContentLoaded' 로는 동작시킬 수 없다.
    //          라우터가 보내줄테니 라우팅 직후 매먼 새 뷰가 생성되고, 뷰 생성자에서 처리해야한다.
    //          View 클래스 생성자가 이 context 전체를 생성자 내부에서 호출하므로 아래 로직도 동시에 호출된다.
    this.afterViewDidLoad()
  }
})

LabelView.prototype.enableCreateLabelButton = function (evt) {
  if (newLabelIsHidden) return

  const label = this.createLabelObject()
  const button = $('#label-create-button')
  if (label.validate()) {
    button.disabled = false
    button.classList.remove('opacity-50')
  } else {
    button.disabled = true
    button.classList.add('opacity-50')
  }
}

// MARK: Keep Editor Status(Persistence Data)
LabelView.prototype.afterViewDidLoad = function loadLabelFromDB() {
  try {
    const store = new Store()
    const savedLabel = store.loadFromPersistenceStorage(newLabel)
    if (savedLabel) {
      this.openNewLabelForm()
      $('#label-name-input').value = savedLabel.name
      $('#label-description-input').value = savedLabel.description
      $('#label-color-value').value = savedLabel.color
      $('#label-preview').style.backgroundColor = savedLabel.color
      this.enableCreateLabelButton()
    }
  } catch (error) {
    console.error("DB 에 Label 데이터 조회 중 에러가 발생했습니다.", error)
  }
}

LabelView.prototype.beforeViewDestroyed = function saveLabelToDB() {
  if (newLabelIsHidden) return  // New Label 창이 닫혀 있다면 저장할 필요 없음.
  try {
    const store = new Store()
    const label = this.createLabelObject()
    store.saveToPersistenceStorage(newLabel, label)
  } catch (error) {
    console.error("DB 에 Label 데이터 저장 중 에러가 발생했습니다.", error)
  }
}

LabelView.prototype.removeLabelAtDB = function () {
  try {
    const store = new Store()
    store.removeAtPersistenceStorage(newLabel)
  } catch (error) {
    console.error("DB 에 Label 데이터 삭제 중 에러가 발생했습니다.", error)
  }
}

// MARK: Setup Mock Data

const mock__NewLabelFormData = () => {
  $('#label-name-input').value = 'refactoring'
  $('#label-description-input').value = 'this is refactoring'
}

