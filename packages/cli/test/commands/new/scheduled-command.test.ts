import * as ProjectChecker from '../../../src/services/project-checker'
import { restore, replace, fake, stub } from 'sinon'
import ScheduledCommand from '../../../src/commands/new/scheduled-command'
import Mustache = require('mustache')
import * as fs from 'fs-extra'
import { IConfig } from '@oclif/config'
import { expect } from '../../expect'
import { template } from '../../../src/services/generator'
import * as path from 'path'

describe('new', (): void => {
  describe('ScheduledCommand', () => {
    const scheduledCommandName = 'ExampleScheduledCommand'
    const scheduledCommandRoot = path.join('src/scheduled-commands/')
    const scheduledCommandPath = `${scheduledCommandRoot}example-scheduled-command.ts`
    const defaultScheduledCommandImports = [
      {
        packagePath: '@boostercloud/framework-core',
        commaSeparatedComponents: 'ScheduledCommand',
      },
      {
        packagePath: '@boostercloud/framework-types',
        commaSeparatedComponents: 'Register',
      },
    ]

    beforeEach(() => {
      stub(ProjectChecker, 'checkCurrentDirIsABoosterProject').returnsThis()
      replace(fs, 'outputFile', fake.resolves({}))
      replace(ProjectChecker, 'checkCurrentDirBoosterVersion', fake.resolves({}))
    })

    afterEach(() => {
      restore()
    })

    it('init calls checkCurrentDirBoosterVersion', async () => {
      await new ScheduledCommand([], {} as IConfig).init()
      expect(ProjectChecker.checkCurrentDirBoosterVersion).to.have.been.called
    })

    describe('Created correctly', () => {
      it('with scheduled command name', async () => {
        await new ScheduledCommand([scheduledCommandName], {} as IConfig).run()
        const renderedCommand = Mustache.render(template('scheduled-command'), {
          imports: defaultScheduledCommandImports,
          name: scheduledCommandName,
        })
        expect(fs.outputFile).to.have.been.calledWithMatch(scheduledCommandPath, renderedCommand)
      })
    })

    describe('displays an error', () => {
      it('with empty scheduled command name', async () => {
        replace(console, 'error', fake.resolves({}))
        await new ScheduledCommand([], {} as IConfig).run()
        expect(fs.outputFile).to.have.not.been.calledWithMatch(scheduledCommandRoot)
        expect(console.error).to.have.been.calledWithMatch(/You haven't provided a scheduled command name/)
      })

      it('with two scheduled command names', async () => {
        let exceptionThrown = false
        let exceptionMessage = ''
        try {
          await new ScheduledCommand([scheduledCommandName, 'AnotherName'], {} as IConfig).run()
        } catch (e) {
          exceptionThrown = true
          exceptionMessage = e.message
        }
        expect(exceptionThrown).to.be.equal(true)
        expect(exceptionMessage).to.contain('Unexpected argument: AnotherName')
        expect(fs.outputFile).to.have.not.been.calledWithMatch(scheduledCommandPath)
      })
    })
  })
})
